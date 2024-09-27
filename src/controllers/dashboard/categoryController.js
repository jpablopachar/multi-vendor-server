/* eslint-disable no-undef */

import { v2 as cloudinary } from 'cloudinary'
import formidable from 'formidable'
import { promisify } from 'util'
import Category from '../../models/category.js'
import { responseReturn } from '../../utils/response.js'

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
})

const parseForm = promisify(formidable().parse)

export class CategoryController {
  addCategory = async (req, res) => {
    try {
      const [fields, files] = await parseForm(req)

      const { name } = fields
      const { image } = files

      if (!name || !image)
        responseReturn(res, 400, {
          error: 'Name and image are required',
        })

      const slug = this._createSlug(name[0])

      const imageUrl = await this._uploadImage(image[0].filepath)

      if (!imageUrl) responseReturn(res, 400, { error: 'Image upload failed' })

      const category = await Category.create({
        name: name[0].trim(),
        slug,
        image: imageUrl,
      })

      responseReturn(res, 201, {
        category,
        message: 'Category added successfully',
      })
    } catch (error) {
      console.error('Error in addCategory:', error)

      responseReturn(res, 500, { error: 'Error adding category' })
    }
  }

  getCategories = async (req, res) => {
    const { page = 1, searchValue = '', parPage = 10 } = req.query
    const skipPage = (parseInt(page) - 1) * parseInt(parPage)

    try {
      const query = searchValue ? { $text: { $search: searchValue } } : {}

      const [categories, total] = await Promise.all([
        Category.find(query)
          .skip(skipPage)
          .limit(parseInt(parPage))
          .sort({ createdAt: -1 }),
        Category.countDocuments(query),
      ])

      responseReturn(res, 200, { categories, total })
    } catch (error) {
      console.error('Error in getCategories:', error)

      responseReturn(res, 500, { error: 'Error retrieving categories' })
    }
  }

  updateCategory = async (req, res) => {
    try {
      const [fields, files] = await parseForm(req)
      const { name } = fields
      const { image } = files
      const { id } = req.params

      if (!name) {
        responseReturn(res, 400, { error: 'Name is required' })
      }

      const slug = this._createSlug(name[0])
      const updateData = { name: name[0].trim(), slug }

      if (image) {
        const imageUrl = await this._uploadImage(image[0].filepath)

        if (!imageUrl)
          responseReturn(res, 400, { error: 'Image upload failed' })

        updateData.image = imageUrl
      }

      const category = await Category.findByIdAndUpdate(id, updateData, {
        new: true,
      })

      if (!category) responseReturn(res, 404, { error: 'Category not found' })

      responseReturn(res, 200, {
        category,
        message: 'Category updated successfully',
      })
    } catch (error) {
      console.error('Error in updateCategory:', error)

      responseReturn(res, 500, { error: 'Error updating category' })
    }
  }

  deleteCategory = async (req, res) => {
    const { id } = req.params

    try {
      const category = await Category.findByIdAndDelete(id)

      if (!category) responseReturn(res, 404, { error: 'Category not found' })

      responseReturn(res, 200, {
        message: 'Category deleted successfully',
      })
    } catch (error) {
      console.error('Error in deleteCategory:', error)

      responseReturn(res, 500, { error: 'Error deleting category' })
    }
  }

  _createSlug = (name) => {
    return name.trim().toLowerCase().split(' ').join('-')
  }

  _uploadImage = async (filepath) => {
    try {
      const result = await cloudinary.uploader.upload(filepath, {
        folder: 'categories',
      })

      return result.url
    } catch (error) {
      console.error('Error uploading image:', error)

      return null
    }
  }
}
