import { Router } from 'express'
import { AuthController } from '../../controllers/auth/authController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const authController = new AuthController()

export const authRouter = Router()

authRouter.post('/admin-login', authController.adminLogin)
authRouter.post('/seller-login', authController.sellerLogin)
authRouter.post('/seller-register', authController.sellerRegister)
authRouter.get('/get-user', authMiddleware, authController.getUser)
authRouter.post(
  '/profile-image-upload',
  authMiddleware,
  authController.profileImageUpload
)
authRouter.post(
  '/profile-info-add',
  authMiddleware,
  authController.profileInfoAdd
)
authRouter.get('/logout', authMiddleware, authController.logout)
