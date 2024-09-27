import { Router } from 'express'

import { ChatController } from '../../controllers/chat/chatController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const chatController = new ChatController()

export const chatRouter = Router()

chatRouter.post(
  '/customer/add-customer-friend',
  chatController.addCustomerFriend
)
chatRouter.post(
  '/customer/send-message-to-seller',
  chatController.customerMessageAdd
)

chatRouter.get('/seller/get-customers/:sellerId', chatController.getCustomers)
chatRouter.get(
  '/seller/get-customer-message/:customerId',
  authMiddleware,
  chatController.getCustomersSellerMessage
)
chatRouter.post(
  '/seller/send-message-to-customer',
  authMiddleware,
  chatController.sellerMessageAdd
)

chatRouter.get('/admin/get-sellers', authMiddleware, chatController.getSellers)
chatRouter.post(
  '/message-send-seller-admin',
  authMiddleware,
  chatController.sellerAdminMessageInsert
)
chatRouter.get(
  '/get-admin-messages/:receiverId',
  authMiddleware,
  chatController.getAdminMessages
)
chatRouter.get(
  '/get-seller-messages',
  authMiddleware,
  chatController.getSellerMessages
)
