/* eslint-disable no-undef */

import moment from 'moment'
import { Types } from 'mongoose'
import Category from '../../models/category.js'
import Product from '../../models/product.js'
import Review from '../../models/review.js'
import { QueryProducts } from '../../utils/queryProducts.js'
import { responseReturn } from '../../utils/response.js'

export class HomeController {
  getCategories = async (req, res) => {
    try {
      const categories = await Category.find({})

      responseReturn(res, 200, { categories })
    } catch (error) {
      console.error('Error in getCategories:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  getProducts = async (req, res) => {
    try {
      const [products, allProduct1, allProduct2, allProduct3] =
        await Promise.all([
          Product.find({}).limit(12).sort({ createdAt: -1 }),
          Product.find({}).limit(9).sort({ createdAt: -1 }),
          Product.find({}).limit(9).sort({ rating: -1 }),
          Product.find({}).limit(9).sort({ discount: -1 }),
        ])

      const latestProduct = this._formatProduct(allProduct1)

      const topRatedProduct = this._formatProduct(allProduct2)

      const discountProduct = this._formatProduct(allProduct3)

      responseReturn(res, 200, {
        products,
        latestProduct,
        topRatedProduct,
        discountProduct,
      })
    } catch (error) {
      console.error('Error in getProducts:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  productPriceRange = async (req, res) => {
    try {
      const [products, minPriceProduct, maxPriceProduct] = await Promise.all([
        Product.find({}).limit(9).sort({ createdAt: -1 }),
        Product.findOne({}).sort({ price: 1 }),
        Product.findOne({}).sort({ price: -1 }),
      ])

      const priceRange = {
        low: minPriceProduct?.price || 0,
        high: maxPriceProduct?.price || 0,
      }

      const latestProduct = this._formatProduct(products)

      responseReturn(res, 200, { latestProduct, priceRange })
    } catch (error) {
      console.error('Error in productPriceRange:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  queryProducts = async (req, res) => {
    const parPage = 12

    req.query.parPage = parPage

    try {
      const filteredProducts = new QueryProducts(
        await Product.find({}),
        req.query
      )
        .categoryQuery()
        .ratingQuery()
        .searchQuery()
        .priceQuery()
        .sortByPrice()

      const totalProductsCount = filteredProducts.countProducts()

      const result = filteredProducts.skip().limit().getProducts()

      responseReturn(res, 200, {
        products: result,
        totalProducts: totalProductsCount,
        parPage,
      })
    } catch (error) {
      console.error('Error in queryProducts:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  productDetails = async (req, res) => {
    const { slug } = req.params

    if (!slug) {
      return responseReturn(res, 400, { error: 'Product slug is required' })
    }

    try {
      const product = await Product.findOne({ slug })

      if (!product) {
        return responseReturn(res, 404, { error: 'Product not found' })
      }

      const [relatedProducts, moreProducts] = await Promise.all([
        Product.find({
          _id: { $ne: product.id },
          category: product.category,
        }).limit(2),

        Product.find({
          _id: { $ne: product.id },
          sellerId: product.sellerId,
        }).limit(3),
      ])

      return responseReturn(res, 200, {
        product,
        relatedProducts,
        moreProducts,
      })
    } catch (error) {
      console.error('Error in productDetails:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  addReview = async (req, res) => {
    const { productId, rating, review, name } = req.body

    if (!productId || !rating || !review || !name) {
      return responseReturn(res, 400, { error: 'All fields are required' })
    }

    try {
      await Review.create({
        productId,
        rating,
        review,
        name,
        date: moment().format('LL'),
      })

      const reviewStats = await Review.aggregate([
        { $match: { productId } },
        {
          $group: {
            _id: '$productId',
            avgRating: { $avg: '$rating' },
          },
        },
      ])

      const productRating =
        reviewStats.length > 0 ? reviewStats[0].avgRating.toFixed(1) : 0

      await Product.findByIdAndUpdate(productId, { rating: productRating })

      return responseReturn(res, 200, { message: 'Review added successfully' })
    } catch (error) {
      console.error('Error in addReview:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  getReviews = async (req, res) => {
    const { productId } = req.params

    if (!productId || !Types.ObjectId.isValid(productId)) {
      return responseReturn(res, 400, { error: 'Invalid productId' })
    }

    let { page = 1 } = req.query

    page = parseInt(page)

    const limit = 5
    const skip = (page - 1) * limit

    try {
      const ratingReview = await Review.aggregate([
        {
          $match: { productId: new Types.ObjectId(productId) },
        },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: -1 },
        },
      ])

      const totalReviews = await Review.countDocuments({ productId })

      const reviews = await Review.find({ productId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })

      return responseReturn(res, 200, {
        reviews,
        totalReviews,
        ratingReview,
      })
    } catch (error) {
      console.error('Error in getReviews:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  _formatProduct = (products) => {
    return products.reduce((acc, _, index) => {
      if (index % 3 === 0) acc.push(products.slice(index, index + 3))

      return acc
    }, [])
  }
}
