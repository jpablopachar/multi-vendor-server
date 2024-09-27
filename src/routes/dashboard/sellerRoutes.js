import { Router } from 'express'
import { SellerController } from '../../controllers/dashboard/sellerController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const sellerController = new SellerController()

export const sellerRouter = Router()

sellerRouter.get(
  '/request-seller-get',
  authMiddleware,
  sellerController.requestSellerGet
)
sellerRouter.get(
  '/get-seller/:sellerId',
  authMiddleware,
  sellerController.getSeller
)
sellerRouter.get(
  '/get-sellers',
  authMiddleware,
  sellerController.getActiveSellers
)
sellerRouter.get(
  '/get-deactive-sellers',
  authMiddleware,
  sellerController.getDeactiveSellers
)

sellerRouter.post(
  '/seller-status-update',
  authMiddleware,
  sellerController.sellerStatusUpdate
)
