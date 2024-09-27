import { Router } from 'express'

import { CardController } from '../../controllers/home/cardController.js'

const cardController = new CardController()

export const cardRouter = Router()

cardRouter.post('/add-to-card', cardController.addToCard)
cardRouter.post('/add-to-wishList', cardController.addWishList)

cardRouter.get('/get-card-products/:userId', cardController.getCardProducts)
cardRouter.get('/get-wishlist-products/:userId', cardController.getWishList)

cardRouter.put('/quantity-inc/:cardId', cardController.quantityIncrement)
cardRouter.put('/quantity-dec/:cardId', cardController.quantityDecrement)

cardRouter.delete(
  '/delete-card-product/:cardId',
  cardController.deleteCardProducts
)
cardRouter.delete(
  '/remove-wishlist-product/:wishlistId',
  cardController.removeWishList
)
