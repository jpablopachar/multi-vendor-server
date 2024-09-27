/* eslint-disable no-undef */

import moment from 'moment'
import { Types } from 'mongoose'
import Stripe from 'stripe'
import { STRIPE_KEY } from '../../config.js'
import AuthorOrders from '../../models/author-orders.js'
import CustomerOrders from '../../models/customer-orders.js'
import ShopWallets from '../../models/shop-wallets.js'
import { responseReturn } from '../../utils/response.js'

const stripe = new Stripe(STRIPE_KEY)

export class OrderController {
  paymentCheck = async (id) => {
    try {
      const order = await CustomerOrders.findById(id)

      if (order.paymentStatus === 'unpaid') {
        await Promise.all([
          CustomerOrders.findByIdAndUpdate(id, { deliveryStatus: 'cancelled' }),
          AuthorOrders.updateMany(
            { orderId: id },
            { deliveryStatus: 'cancelled' }
          ),
        ])
      }

      return true
    } catch (error) {
      console.log(error.message)
    }
  }

  placeOrder = async (req, res) => {
    const { price, products, shippingFee, shippingInfo, userId } = req.body

    try {
      const tempDate = moment().format('LLL')

      const { customerOrderProducts, cardIds } =
        this._extractCustomerOrderProducts(products)

      const order = await CustomerOrders.create({
        customerId: userId,
        shippingInfo,
        products: customerOrderProducts,
        price: price + shippingFee,
        paymentStatus: 'unpaid',
        deliveryStatus: 'pending',
        date: tempDate,
      })

      const authorOrderData = this._buildAuthorOrders(
        products,
        order._id,
        tempDate
      )

      await AuthorOrders.insertMany(authorOrderData)

      await this._removeCardItems(cardIds)

      setTimeout(() => {
        this.paymentCheck(order.id)
      }, 15000)

      responseReturn(res, 200, {
        message: 'Order placed successfully',
        orderId: order.id,
      })
    } catch (error) {
      return responseReturn(res, 500, { error: error.message })
    }
  }

  getCustomerDashboardData = async (req, res) => {
    const { userId } = req.params

    try {
      const customerId = new Types.ObjectId(userId)

      const [recentOrders, orderCounts] = await Promise.all([
        CustomerOrders.find({ customerId }).limit(5),
        CustomerOrders.aggregate([
          { $match: { customerId } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              pendingOrders: {
                $sum: {
                  $cond: [{ $eq: ['$deliveryStatus', 'pending'] }, 1, 0],
                },
              },
              cancelledOrders: {
                $sum: {
                  $cond: [{ $eq: ['$deliveryStatus', 'cancelled'] }, 1, 0],
                },
              },
            },
          },
        ]),
      ])

      const { totalOrders, pendingOrders, cancelledOrders } =
        orderCounts[0] || {
          totalOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
        }

      responseReturn(res, 200, {
        recentOrders,
        pendingOrders,
        totalOrders,
        cancelledOrders,
      })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  getOrders = async (req, res) => {
    const { customerId, status } = req.params

    try {
      const query = { customerId: new Types.ObjectId(customerId) }

      if (status !== 'all') query.deliveryStatus = status

      const orders = await CustomerOrders.find(query)

      responseReturn(res, 200, { orders })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  getOrderDetails = async (req, res) => {
    const { orderId } = req.params

    try {
      const order = await CustomerOrders.findById(orderId)

      responseReturn(res, 200, { order })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  getAdminOrders = async (req, res) => {
    let { page = 1, parPage = 10 } = req.query

    page = parseInt(page) || 1
    parPage = parseInt(parPage) || 10

    const skipPage = parPage * (page - 1)

    try {
      const pipeline = [
        {
          $lookup: {
            from: 'author_orders',
            localField: '_id',
            foreignField: 'orderId',
            as: 'subOrder',
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $facet: {
            paginatedResults: [{ $skip: skipPage }, { $limit: parPage }],
            totalOrders: [{ $count: 'count' }],
          },
        },
      ]

      const result = await CustomerOrders.aggregate(pipeline)
      const orders = result[0].paginatedResults
      const totalOrders = result[0].totalOrders[0]?.count || 0

      responseReturn(res, 200, { orders, totalOrders })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  getAdminOrder = async (req, res) => {
    const { orderId } = req.params

    try {
      const order = await CustomerOrders.aggregate([
        { $match: { _id: new Types.ObjectId(orderId) } },
        {
          $lookup: {
            from: 'author_orders',
            localField: '_id',
            foreignField: 'orderId',
            as: 'subOrder',
          },
        },
      ])

      responseReturn(res, 200, { order: order[0] })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  adminOrderStatusUpdate = async (req, res) => {
    const { orderId } = req.params
    const { status } = req.body

    try {
      await CustomerOrders.findOneAndUpdate(orderId, { deliveryStatus: status })

      responseReturn(res, 200, { message: 'Order status updated successfully' })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  getSellerOrders = async (req, res) => {
    const { sellerId } = req.params

    let { page, parPage } = req.query

    page = parseInt(page) || 1
    parPage = parseInt(parPage) || 10

    const skipPage = parPage * (page - 1)

    try {
      const result = await AuthorOrders.aggregate([
        {
          $match: { sellerId },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $facet: {
            paginatedResults: [{ $skip: skipPage }, { $limit: parPage }],
            totalOrders: [{ $count: 'count' }],
          },
        },
      ])

      const orders = result[0].paginatedResults
      const totalOrders = result[0].totalOrders[0]?.count || 0

      responseReturn(res, 200, { orders, totalOrders })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  getSellerOrder = async (req, res) => {
    const { orderId } = req.params

    try {
      const order = await AuthorOrders.findById(orderId)

      responseReturn(res, 200, { order })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  sellerOrderStatusUpdate = async (req, res) => {
    const { orderId } = req.params
    const { status } = req.body

    try {
      await AuthorOrders.findOneAndUpdate(orderId, { deliveryStatus: status })

      responseReturn(res, 200, { message: 'Order status updated successfully' })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  createPayment = async (req, res) => {
    const { price } = req.body

    try {
      const payment = await stripe.paymentIntents.create({
        amount: price * 100,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
      })

      responseReturn(res, 200, { clientSecret: payment.client_secret })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  orderConfirm = async (req, res) => {
    const { orderId } = req.params

    try {
      const objectId = new Types.ObjectId(orderId)
      const currentDate = moment()
      const month = currentDate.format('M')
      const year = currentDate.format('YYYY')

      await Promise.all([
        CustomerOrders.findByIdAndUpdate(orderId, { paymentStatus: 'paid' }),
        AuthorOrders.updateMany(
          { orderId: objectId },
          { paymentStatus: 'paid', deliveryStatus: 'pending' }
        ),
      ])

      const [customerOrder, authorOrders] = await Promise.all([
        CustomerOrders.findById(orderId),
        AuthorOrders.find({ orderId: objectId }),
      ])

      await ShopWallets.create({
        amount: customerOrder.price,
        month,
        year,
      })

      await Promise.all(
        authorOrders.map((order) =>
          sellerWallet.create({
            sellerId: order.sellerId.toString(),
            amount: order.price,
            month,
            year,
          })
        )
      )

      responseReturn(res, 200, { message: 'Order confirmed successfully' })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  // Extrae los productos del cliente
  _extractCustomerOrderProducts(products) {
    const customerOrderProducts = []
    const cardIds = []

    products.forEach(({ products: pro }) => {
      pro.forEach(({ productInfo, _id, quantity }) => {
        const tempCusPro = { ...productInfo, quantity }

        customerOrderProducts.push(tempCusPro)

        if (_id) cardIds.push(_id)
      })
    })

    return { customerOrderProducts, cardIds }
  }

  // Construye las órdenes del autor
  _buildAuthorOrders(products, orderId, tempDate) {
    return products.map(({ products: pro, price, sellerId }) => {
      const storeProducts = pro.map(({ productInfo, quantity }) => ({
        ...productInfo,
        quantity,
      }))

      return {
        orderId,
        sellerId,
        products: storeProducts,
        price,
        paymentStatus: 'unpaid',
        shippingInfo: 'Easy Main Warehouse',
        deliveryStatus: 'pending',
        date: tempDate,
      }
    })
  }

  // Eliminar ítems de la tarjeta
  async _removeCardItems(cardIds) {
    await Promise.all(cardIds.map((id) => Card.findByIdAndDelete(id)))
  }
}
