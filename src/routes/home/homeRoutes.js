import { Router } from 'express'

import { HomeController } from '../../controllers/home/homeController.js'

const homeController = new HomeController()

export const homeRouter = Router()

homeRouter.get('/get-categories', homeController.getCategories)
homeRouter.get('/get-products', homeController.getProducts)
homeRouter.get('/product-price-range-latest', homeController.productPriceRange)
homeRouter.get('/query-products', homeController.queryProducts)
homeRouter.get('/product-details/:slug', homeController.productDetails)
homeRouter.post('/customer/add-review', homeController.addReview)
homeRouter.get('/customer/get-reviews/:productId', homeController.getReviews)
