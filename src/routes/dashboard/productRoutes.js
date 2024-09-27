import { Router } from 'express'
import { ProductController } from '../../controllers/dashboard/productController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const productController = new ProductController()

export const productRouter = Router()

productRouter.post('/product-add', authMiddleware, productController.addProduct)
productRouter.post(
  '/product-update',
  authMiddleware,
  productController.updateProduct
)
productRouter.post(
  '/product-image-update',
  authMiddleware,
  productController.updateProductImage
)

productRouter.get(
  '/products-get',
  authMiddleware,
  productController.getProducts
)
productRouter.get(
  '/product-get/:productId',
  authMiddleware,
  productController.getProduct
)
