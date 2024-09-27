/* eslint-disable no-undef */

import AdminSellerMessage from '../../models/chat/admin-seller-message.js'
import SellerCustomerMessage from '../../models/chat/seller-customer-message.js'
import SellerCustomer from '../../models/chat/seller-customer.js'
import Customer from '../../models/customer.js'
import Seller from '../../models/seller.js'
import { responseReturn } from '../../utils/response.js'

export class ChatController {
  addCustomerFriend = async (req, res) => {
    const { sellerId, userId } = req.body

    if (!sellerId || !userId)
      responseReturn(res, 400, {
        error: 'sellerId and userId are required',
      })

    try {
      if (sellerId === '') {
        const myFriends = await SellerCustomer.findOne({ myId: userId })

        responseReturn(res, 200, { myFriends: myFriends.myFriends })
      }

      const [seller, user] = await Promise.all([
        Seller.findById(sellerId),
        Customer.findById(userId),
      ])

      if (!seller) responseReturn(res, 404, { error: 'Seller not found' })

      if (!user) responseReturn(res, 404, { error: 'User not found' })

      const checkSeller = await SellerCustomer.findOne({
        myId: userId,
        'myFriends.fdIn': sellerId,
      })

      if (!checkSeller) {
        await SellerCustomer.updateOne(
          { myId: userId },
          {
            $push: {
              myFriends: {
                fdIn: sellerId,
                name: seller.shopInfo?.shopName,
                image: seller.image,
              },
            },
          }
        )
      }

      const checkCustomer = await SellerCustomer.findOne({
        myId: sellerId,
        'myFriends.fdIn': userId,
      })

      if (!checkCustomer) {
        await SellerCustomer.updateOne(
          { myId: sellerId },
          {
            $push: {
              myFriends: {
                fdIn: userId,
                name: user.name,
                image: '',
              },
            },
          }
        )
      }

      const messages = await SellerCustomerMessage.find({
        $or: [
          { receiverId: sellerId, senderId: userId },
          { receiverId: userId, senderId: sellerId },
        ],
      })

      const myFriends = await SellerCustomer.findOne({ myId: userId })

      const currentFriend = myFriends.myFriends.find((fd) => fd.fdIn === sellerId)

      responseReturn(res, 200, {
        messages,
        friends: myFriends.myFriends,
        currentFriend,
      })
    } catch (error) {
      console.error('Error in addCustomerFriend:', error)

      responseReturn(res, 500, { error: 'Error in addCustomerFriend' })
    }
  }

  customerMessageAdd = async (req, res) => {
    const { userId, text, sellerId, name } = req.body

    if (!userId || !text || !sellerId || !name)
      responseReturn(res, 400, {
        error: 'userId, text, sellerId and name are required',
      })

    try {
      const message = await SellerCustomerMessage.create({
        senderName: name,
        senderId: userId,
        receiverId: sellerId,
        message: text,
      })

      await this._updateFriendPosition(userId, sellerId)
      await this._updateFriendPosition(sellerId, userId)

      responseReturn(res, 200, { message })
    } catch (error) {
      console.error('Error in customerMessageAdd:', error)

      responseReturn(res, 500, { error: 'Error in customerMessageAdd' })
    }
  }

  getCustomers = async (req, res) => {
    const { sellerId } = req.params

    if (!sellerId)
      responseReturn(res, 400, {
        error: 'sellerId is required',
      })

    try {
      const data = await SellerCustomer.findOne({ myId: sellerId })

      responseReturn(res, 200, { customers: data.myFriends })
    } catch (error) {
      console.error('Error in getCustomers:', error)

      responseReturn(res, 500, { error: 'Error in getCustomers' })
    }
  }

  getCustomersSellerMessage = async (req, res) => {
    const { customerId } = req.params
    const { id } = req

    try {
      const messages = await SellerCustomerMessage.find({
        $or: [
          { receiverId: customerId, senderId: id },
          { receiverId: id, senderId: customerId },
        ],
      })

      const currentCustomer = await Customer.findById(customerId)

      responseReturn(res, 200, { messages, currentCustomer })
    } catch (error) {
      console.error('Error in getCustomersSellerMessage:', error)

      responseReturn(res, 500, { error: 'Error in getCustomersSellerMessage' })
    }
  }

  sellerMessageAdd = async (req, res) => {
    const { senderId, text, receiverId, name } = req.body

    if (!senderId || !text || !receiverId || !name)
      responseReturn(res, 400, {
        error: 'senderId, text, receiverId and name are required',
      })

    try {
      const message = await SellerCustomerMessage.create({
        senderName: name,
        senderId,
        receiverId,
        message: text,
      })

      await this._updateFriendPosition(senderId, receiverId)
      await this._updateFriendPosition(receiverId, senderId)

      responseReturn(res, 200, { message })
    } catch (error) {
      console.error('Error in sellerMessageAdd:', error)

      responseReturn(res, 500, { error: 'Error in sellerMessageAdd' })
    }
  }

  getSellers = async (req, res) => {
    try {
      const sellers = await Seller.find({})

      responseReturn(res, 200, { sellers })
    } catch (error) {
      console.error('Error in getSellers:', error)

      responseReturn(res, 500, { error: 'Error in getSellers' })
    }
  }

  sellerAdminMessageInsert = async (req, res) => {
    const { senderId, receiverId, message, senderName } = req.body

    if (!message || !senderName)
      responseReturn(res, 400, {
        error: 'message and senderName are required',
      })

    try {
      const messageData = await AdminSellerMessage.create({
        senderId,
        receiverId,
        message,
        senderName,
      })

      responseReturn(res, 200, { message: messageData })
    } catch (error) {
      console.error('Error in sellerAdminMessageInsert:', error)

      responseReturn(res, 500, { error: 'Error in sellerAdminMessageInsert' })
    }
  }

  getAdminMessages = async (req, res) => {
    const { receiverId } = req.params

    if (!receiverId)
      responseReturn(res, 400, { error: 'receiverId is required' })

    const id = ''

    try {
      const messages = await AdminSellerMessage.find({
        $or: [
          { receiverId: { $eq: receiverId }, senderId: { $eq: id } },
          { receiverId: { $eq: id }, senderId: { $eq: receiverId } },
        ],
      })

      const currentSeller = receiverId ? await Seller.findById(receiverId) : {}

      responseReturn(res, 200, { messages, currentSeller })
    } catch (error) {
      console.error('Error in getAdminMessages:', error)

      responseReturn(res, 500, { error: 'Error in getAdminMessages' })
    }
  }

  getSellerMessages = async (req, res) => {
    const receiverId = ''
    const { id } = req

    try {
      const messages = await AdminSellerMessage.find({
        $or: [
          { receiverId: { $eq: receiverId }, senderId: { $eq: id } },
          { receiverId: { $eq: id }, senderId: { $eq: receiverId } },
        ],
      })

      responseReturn(res, 200, { messages })
    } catch (error) {
      console.error('Error in getSellerMessages:', error)

      responseReturn(res, 500, { error: 'Error in getSellerMessages' })
    }
  }

  _updateFriendPosition = async (userId, friendId) => {
    const data = await SellerCustomer.findOne({ myId: userId })

    let myFriends = data.myFriends
    let index = myFriends.findIndex((fd) => fd.fdIn === friendId)

    while (index > 0) {
      let temp = myFriends[index]

      myFriends[index] = myFriends[index - 1]
      myFriends[index - 1] = temp
      index--
    }

    await SellerCustomer.updateOne({ myId: userId }, { myFriends })
  }
}
