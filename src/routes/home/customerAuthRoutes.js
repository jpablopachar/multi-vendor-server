import { Router } from 'express'

import { CustomerAuthController } from '../../controllers/home/customerAuthController.js'

const customerAuthController = new CustomerAuthController()

export const customerAuthRouter = Router()

customerAuthRouter.post('/customer-register', customerAuthController.customerRegister)
customerAuthRouter.post('/customer-login', customerAuthController.customerLogin)

customerAuthRouter.get('/logout', customerAuthController.customerLogout)