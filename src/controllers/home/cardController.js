import { Types } from 'mongoose'
import Card from '../../models/card.js'
import WishList from '../../models/wishList.js'
import { responseReturn } from '../../utils/response.js'

export class CardController {
  addToCard = async (req, res) => {
    const { userId, productId, quantity } = req.body

    try {
      const existingProduct = await Card.findOne({ productId, userId })

      if (existingProduct) {
        return responseReturn(res, 404, {
          error: 'Product already added to card',
        })
      } else {
        const product = await Card.create({ userId, productId, quantity })

        return responseReturn(res, 201, {
          message: 'Added to card successfully',
          product,
        })
      }
    } catch (error) {
      return responseReturn(res, 500, { error: error.message })
    }
  }

  getCardProducts = async (req, res) => {
    const { userId } = req.params

    const commissionRate = 5

    try {
      // Obtener productos del carrito y realizar la relación con los productos
      const cardProducts = await Card.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'products',
          },
        },
      ])

      let buyProductItem = 0
      let calculatePrice = 0
      let cardProductCount = 0

      // Separar productos fuera de stock y con stock
      const outOfStockProducts = cardProducts.filter(
        (product) => product.products[0].stock < product.quantity
      )

      const stockProduct = cardProducts.filter(
        (product) => product.products[0].stock >= product.quantity
      )

      // Calcular cantidad de productos fuera de stock
      cardProductCount = outOfStockProducts.reduce(
        (acc, product) => acc + product.quantity,
        0
      )

      // Calcular precio total y productos comprables
      stockProduct.forEach((product) => {
        const { quantity } = product
        const { price, discount } = product.products[0]

        // Actualiza el total de productos comprables
        buyProductItem += quantity

        // Calcula el precio con descuento si existe
        let finalPrice = price

        if (discount) finalPrice = price - Math.floor((price * discount) / 100)

        calculatePrice += quantity * finalPrice
      })

      // Agrupar productos por vendedor
      const productsBySeller = stockProduct.reduce((acc, product) => {
        const productInfo = product.products[0]
        const sellerId = productInfo.sellerId.toString()

        if (!acc[sellerId]) {
          acc[sellerId] = {
            sellerId: sellerId,
            shopName: productInfo.shopName,
            price: 0,
            products: [],
          }
        }

        let productPrice = productInfo.price

        if (productInfo.discount)
          productPrice =
            productInfo.price -
            Math.floor((productInfo.price * productInfo.discount) / 100)

        // Aplicar comisión
        productPrice =
          productPrice - Math.floor((productPrice * commissionRate) / 100)
        acc[sellerId].price += productPrice * product.quantity

        acc[sellerId].products.push({
          _id: product._id,
          quantity: product.quantity,
          productInfo: productInfo,
        })

        return acc
      }, {})

      const productArray = Object.values(productsBySeller)

      responseReturn(res, 200, {
        cardProducts: productArray,
        price: calculatePrice,
        cardProductCount,
        shippingFee: 20 * productArray.length,
        outOfStockProducts,
        buyProductItem,
      })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  deleteCardProducts = async (req, res) => {
    const { cardId } = req.params

    try {
      await Card.findByIdAndDelete(cardId)

      responseReturn(res, 200, { message: 'Product deleted successfully' })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  quantityIncrement = async (req, res) => {
    const { cardId } = req.params

    try {
      const product = await Card.findById(cardId)

      const { quantity } = product

      await Card.findByIdAndUpdate(cardId, { quantity: quantity + 1 })

      responseReturn(res, 200, { message: 'Quantity updated' })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  quantityDecrement = async (req, res) => {
    const { cardId } = req.params

    try {
      const product = await Card.findById(cardId)

      const { quantity } = product

      await Card.findByIdAndUpdate(cardId, { quantity: quantity - 1 })

      responseReturn(res, 200, { message: 'Quantity updated' })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  addWishList = async (req, res) => {
    const { slug } = req.body

    try {
      const product = await WishList.findOne({ slug })

      if (product) {
        return responseReturn(res, 404, {
          error: 'Product already added to wish list',
        })
      } else {
        await WishList.create(req.body)

        return responseReturn(res, 201, {
          message: 'Added to wish list successfully',
        })
      }
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  getWishList = async (req, res) => {
    const { userId } = req.params

    try {
      const wishList = await WishList.find({ userId })

      responseReturn(res, 200, { wishListCount: wishList.length, wishList })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }

  removeWishList = async (req, res) => {
    const { wishlistId } = req.params

    try {
      await WishList.findByIdAndDelete(wishlistId)

      responseReturn(res, 200, {
        message: 'Product removed from wishList',
        wishlistId,
      })
    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  }
}
