import { Router } from 'express'

import { PaymentController } from '../../controllers/payment/paymentController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const paymentController = new PaymentController()

export const paymentRouter = Router()

paymentRouter.get(
  '/create-stripe-connect-account',
  authMiddleware,
  paymentController.createStripeConnectAccount
)

paymentRouter.put(
  '/active-stripe-connect-account/:code',
  authMiddleware,
  paymentController.activeStripeConnectAccount
)

paymentRouter.get(
  '/seller-payment-details/:sellerId',
  authMiddleware,
  paymentController.getSellerPaymentDetails
)

paymentRouter.post(
  '/withdraw-request',
  authMiddleware,
  paymentController.withdrawRequest
)

paymentRouter.get(
  '/request',
  authMiddleware,
  paymentController.getPaymentRequest
)

paymentRouter.post(
  '/request-confirm',
  authMiddleware,
  paymentController.paymentRequestConfirm
)
