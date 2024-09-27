/* eslint-disable no-undef */

import { v2 as cloudinary } from 'cloudinary'
import formidable from 'formidable'
import { Types } from 'mongoose'
import AuthorOrders from '../../models/author-orders.js'
import Banner from '../../models/banner.js'
import AdminSellerMessage from '../../models/chat/admin-seller-message.js'
import SellerCustomerMessage from '../../models/chat/seller-customer-message.js'
import CustomerOrders from '../../models/customer-orders.js'
import Customer from '../../models/customer.js'
import Product from '../../models/product.js'
import SellerWallets from '../../models/seller-wallets.js'
import Seller from '../../models/seller.js'
import ShopWallets from '../../models/shop-wallets.js'
import { responseReturn } from '../../utils/response.js'

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
})

export class DashboardController {
  getAdminDashboardData = async (req, res) => {
    try {
      const [
        totalSale,
        totalProducts,
        totalOrders,
        totalSellers,
        messages,
        recentOrders,
      ] = await Promise.all([
        ShopWallets.aggregate([
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
            },
          },
        ]),
        Product.countDocuments(),
        Customer.countDocuments(),
        Seller.countDocuments(),
        AdminSellerMessage.find().sort({ createdAt: -1 }).limit(3),
        CustomerOrders.find().sort({ createdAt: -1 }).limit(5),
      ])

      responseReturn(res, 200, {
        totalProducts,
        totalOrders,
        totalSellers,
        messages,
        recentOrders,
        totalSale: totalSale.length > 0 ? totalSale[0].totalAmount : 0,
      })
    } catch (error) {
      console.log('Error in getAdminDashboardData', error)

      responseReturn(res, 500, { error: 'Error get admin dashboard data' })
    }
  }

  getSellerDashboardData = async (req, res) => {
    const { id } = req
    try {
      const sellerObjectId = new Types.ObjectId(id)

      const [
        totalSale,
        totalProducts,
        totalOrders,
        totalPendingOrders,
        messages,
        recentOrders,
      ] = await Promise.all([
        SellerWallets.aggregate([
          {
            $match: { sellerId: sellerObjectId },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
            },
          },
        ]),
        Product.countDocuments({ sellerId: sellerObjectId }),
        AuthorOrders.countDocuments({ sellerId: sellerObjectId }),
        AuthorOrders.countDocuments({
          sellerId: sellerObjectId,
          deliveryStatus: 'pending',
        }),
        SellerCustomerMessage.find({
          $or: [{ senderId: sellerObjectId }, { receiverId: sellerObjectId }],
        }).limit(3),
        AuthorOrders.find({ sellerId: sellerObjectId })
          .sort({ createdAt: -1 })
          .limit(5),
      ])

      responseReturn(res, 200, {
        totalProducts,
        totalOrders,
        totalPendingOrders,
        messages,
        recentOrders,
        totalSale: totalSale.length > 0 ? totalSale[0].totalAmount : 0,
      })
    } catch (error) {
      console.log('Error in getSellerDashboardData', error)

      responseReturn(res, 500, { error: 'Error get seller dashboard data' })
    }
  }

  getBanners = async (req, res) => {
    try {
      const banners = await Banner.aggregate([{ $sample: { size: 5 } }])

      responseReturn(res, 200, { banners })
    } catch (error) {
      console.log('Error in getBanners', error)

      responseReturn(res, 500, { error: 'Error get banners' })
    }
  }

  getBanner = async (req, res) => {
    const { productId } = req.params

    try {
      const banner = await Banner.findOne({
        productId: new Types.ObjectId(productId),
      })

      responseReturn(res, 200, { banner })
    } catch (error) {
      console.log('Error in getBanner', error)

      responseReturn(res, 500, { error: 'Error get banner' })
    }
  }

  addBanner = async (req, res) => {
    const form = formidable({ multiples: true })

    form.parse(req, async (err, field, files) => {
      if (err) responseReturn(res, 500, { error: 'Error parsing form' })

      const { productId } = field
      const mainban = files.mainban?.[0]

      if (!productId || !mainban?.filepath)
        responseReturn(res, 400, {
          error: 'Product ID or banner image missing',
        })

      try {
        const product = await Product.findById(productId)

        if (!product) responseReturn(res, 404, { error: 'Product not found' })

        const result = await cloudinary.uploader.upload(mainban[0].filepath, {
          folder: 'banners',
        })

        const banner = await Banner.create({
          productId,
          banner: result.url,
          link: product.slug,
        })

        responseReturn(res, 200, {
          message: 'Banner added successfully',
          banner,
        })
      } catch (error) {
        console.log('Error in addBanner', error)

        responseReturn(res, 500, { error: 'Error add banner' })
      }
    })
  }

  updateBanner = async (req, res) => {
    const { bannerId } = req.params

    if (!bannerId) responseReturn(res, 400, { error: 'bannerId is required' })

    const form = formidable({})

    form.parse(req, async (err, _, files) => {
      if (err) responseReturn(res, 500, { error: 'Error parsing form' })

      const mainban = files.mainban?.[0]

      if (!mainban?.filepath)
        responseReturn(res, 400, {
          error: 'Banner image missing',
        })

      try {
        let banner = await Banner.findById(bannerId)

        if (!banner) responseReturn(res, 404, { error: 'Banner not found' })

        const imageName = path.basename(banner.banner).split('.')[0]

        await cloudinary.uploader.destroy(imageName)

        const { url } = await cloudinary.uploader.upload(mainban.filepath, {
          folder: 'banners',
        })

        banner = await Banner.findByIdAndUpdate(
          bannerId,
          { banner: url },
          { new: true }
        )

        responseReturn(res, 200, {
          message: 'Banner updated successfully',
          banner,
        })
      } catch (error) {
        console.log('Error in updateBanner', error)

        responseReturn(res, 500, { error: 'Error update banner' })
      }
    })
  }
}
