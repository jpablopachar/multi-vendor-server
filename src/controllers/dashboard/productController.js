/* eslint-disable no-undef */

import { v2 as cloudinary } from 'cloudinary'
import formidable from 'formidable'
import Product from '../../models/product.js'
import { responseReturn } from '../../utils/response.js'

export class ProductController {
  addProduct = async (req, res) => {
    const { id } = req

    const form = formidable({ multiples: true })

    form.parse(req, async (err, field, files) => {
      let {
        name,
        category,
        description,
        stock,
        price,
        discount,
        shopName,
        brand,
      } = field

      const { images } = files

      name = name[0].trim()

      const slug = name.split(' ').join('-')

      cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_API_KEY,
        api_secret: process.env.CLOUD_API_SECRET,
        secure: true,
      })

      try {
        let allImageUrl = []

        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.uploader.upload(images[i].filepath, {
            folder: 'products',
          })

          allImageUrl = [...allImageUrl, result.url]
        }

        await Product.create({
          sellerId: id,
          name,
          slug,
          shopName: shopName[0].trim(),
          category: category[0].trim(),
          description: description[0].trim(),
          stock: parseInt(stock[0]),
          price: parseInt(price[0]),
          discount: parseInt(discount[0]),
          images: allImageUrl,
          brand: brand[0].trim(),
        })

        responseReturn(res, 201, { message: 'Product added successfully' })
      } catch (error) {
        responseReturn(res, 500, { error: error.message })
      }
    })
  }

  getProducts = async (req, res) => {
    const { page, searchValue, parPage } = req.query
    const { id } = req

    const skipPage = parseInt(parPage) * (parseInt(page) - 1)

    try {
      if (searchValue) {
        const products = await Product.find({
          $text: { $search: searchValue },
          sellerId: id,
        })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 })

        const total = await Product.find({
          $text: { $search: searchValue },
          sellerId: id,
        }).countDocuments()

        responseReturn(res, 200, { products, total })
      } else {
        const products = await Product.find({ sellerId: id })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 })

        const total = await Product.find({ sellerId: id }).countDocuments()

        responseReturn(res, 200, { products, total })
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  getProduct = async (req, res) => {
    const { productId } = req.params

    try {
      const product = await Product.findById(productId)

      responseReturn(res, 200, { product })
    } catch (error) {
      console.log(error.message)
    }
  }

  updateProduct = async (req, res) => {
    let { name, description, stock, price, discount, brand, productId } =
      req.body

    name = name.trim()

    const slug = name.split(' ').join('-')

    try {
      await Product.findByIdAndUpdate(productId, {
        name,
        description,
        stock,
        price,
        discount,
        brand,
        productId,
        slug,
      })

      const product = await Product.findById(productId)

      responseReturn(res, 200, {
        product,
        message: 'Product updated successfully',
      })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  updateProductImage = async (req, res) => {
    const form = formidable({ multiples: true })

    form.parse(req, async (err, field, files) => {
      const { oldImage, productId } = field
      const { newImage } = files

      if (err) {
        responseReturn(res, 400, { error: err.message })
      } else {
        try {
          cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.CLOUD_API_KEY,
            api_secret: process.env.CLOUD_API_SECRET,
            secure: true,
          })

          const result = await cloudinary.uploader.upload(
            newImage[0].filepath,
            {
              folder: 'products',
            }
          )

          if (result) {
            let { images } = await Product.findById(productId)

            const index = images.findIndex((image) => image === oldImage)

            images[index] = result.url

            await Product.findByIdAndUpdate(productId, { images })

            const product = await Product.findById(productId, { images })

            responseReturn(res, 200, {
              product,
              message: 'Product Image updated successfully',
            })
          } else {
            responseReturn(res, 404, { error: 'Image upload failed' })
          }
        } catch (error) {
          responseReturn(res, 404, { error: error.message })
        }
      }
    })
  }
}
