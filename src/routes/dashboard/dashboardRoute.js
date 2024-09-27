import { Router } from 'express'
import { DashboardController } from '../../controllers/dashboard/dashboardController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const dashboardController = new DashboardController()

export const dashboardRouter = Router()

dashboardRouter.get(
  '/admin/get-dashboard-data',
  authMiddleware,
  dashboardController.getAdminDashboardData
)
dashboardRouter.get(
  '/seller/get-dashboard-data',
  authMiddleware,
  dashboardController.getSellerDashboardData
)

dashboardRouter.post(
  '/banner/add',
  authMiddleware,
  dashboardController.addBanner
)

dashboardRouter.get(
  '/banner/get/:productId',
  authMiddleware,
  dashboardController.getBanner
)

dashboardRouter.put(
  '/banner/update/:bannerId',
  authMiddleware,
  dashboardController.updateBanner
)

dashboardRouter.get('/banners', dashboardController.getBanners)
