/* eslint-disable no-undef */

import Seller from '../../models/seller.js'
import { responseReturn } from '../../utils/response.js'

export class SellerController {
  requestSellerGet = async (req, res) => {
    const { page, searchValue, parPage } = req.query

    const skipPage = parseInt(parPage) * (parseInt(page) - 1)

    try {
      if (!searchValue) {
        const sellers = await Seller.find({ status: 'pending' })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 })

        const totalSellers = await Seller.find({
          status: 'pending',
        }).countDocuments()

        return responseReturn(res, 200, { sellers, totalSellers })
      }
    } catch (error) {
      return responseReturn(res, 500, { error: error.message })
    }
  }

  getSeller = async (req, res) => {
    const { sellerId } = req.params

    try {
      const seller = await Seller.findById(sellerId)

      return responseReturn(res, 200, { seller })
    } catch (error) {
      return responseReturn(res, 500, { error: error.message })
    }
  }

  sellerStatusUpdate = async (req, res) => {
    const { sellerId, status } = req.body

    try {
      await Seller.findByIdAndUpdate(sellerId, { status })

      const seller = await Seller.findById(sellerId)

      return responseReturn(res, 200, {
        seller,
        message: 'Seller status updated successfully',
      })
    } catch (error) {
      return responseReturn(res, 500, { error: error.message })
    }
  }

  getActiveSellers = async (req, res) => {
    let { page, searchValue, parPage } = req.query

    page = parseInt(page)
    parPage = parseInt(parPage)

    const skipPage = parPage * (page - 1)

    try {
      if (searchValue) {
        const sellers = await Seller.find({
          $text: { $search: searchValue },
          status: 'active',
        })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 })

        const totalSellers = await Seller.find({
          $text: { $search: searchValue },
          status: 'active',
        }).countDocuments()

        return responseReturn(res, 200, { sellers, totalSellers })
      } else {
        const sellers = await Seller.find({ status: 'active' })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 })

        const totalSellers = await Seller.find({
          status: 'active',
        }).countDocuments()

        return responseReturn(res, 200, { sellers, totalSellers })
      }
    } catch (error) {
      console.log('Active sellers error', error.message)
    }
  }

  getDeactiveSellers = async (req, res) => {
    let { page, searchValue, parPage } = req.query

    page = parseInt(page)
    parPage = parseInt(parPage)

    const skipPage = parPage * (page - 1)

    try {
      if (searchValue) {
        const sellers = await Seller.find({
          $text: { $search: searchValue },
          status: 'deactive',
        })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 })

        const totalSellers = await Seller.find({
          $text: { $search: searchValue },
          status: 'deactive',
        }).countDocuments()

        return responseReturn(res, 200, { sellers, totalSellers })
      } else {
        const sellers = await Seller.find({ status: 'deactive' })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 })

        const totalSellers = await Seller.find({
          status: 'deactive',
        }).countDocuments()

        return responseReturn(res, 200, { sellers, totalSellers })
      }
    } catch (error) {
      console.log('Deactive sellers error', error.message)
    }
  }
}
