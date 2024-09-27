import { Router } from 'express'
import { CategoryController } from '../../controllers/dashboard/categoryController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const categoryController = new CategoryController()

export const categoryRouter = Router()

categoryRouter.post('/category-add', authMiddleware, categoryController.addCategory)
categoryRouter.get('/category-get', authMiddleware, categoryController.getCategories)
categoryRouter.put('/category-update/:id', authMiddleware, categoryController.updateCategory)
categoryRouter.delete('/category/:id', authMiddleware, categoryController.deleteCategory)