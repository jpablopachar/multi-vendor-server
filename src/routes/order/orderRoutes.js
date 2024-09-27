import { Router } from 'express'

import { OrderController } from '../../controllers/order/orderController.js'

const orderController = new OrderController()

export const orderRouter = Router()

orderRouter.post('/home/order/place-order', orderController.placeOrder)

orderRouter.get(
  '/home/customer/get-dashboard-data/:userId',
  orderController.getCustomerDashboardData
)
orderRouter.get(
  '/home/customer/get-orders/:customerId/:status',
  orderController.getOrders
)
orderRouter.get(
  '/home/customer/get-order-details/:orderId',
  orderController.getOrderDetails
)

orderRouter.post('/order/create-payment', orderController.createPayment)
orderRouter.get('/order/confirm/:orderId', orderController.orderConfirm)

orderRouter.get('/admin/orders', orderController.getAdminOrders)
orderRouter.get('/admin/order/:orderId', orderController.getAdminOrder)
orderRouter.put(
  '/admin/order-status/update/:orderId',
  orderController.adminOrderStatusUpdate
)

orderRouter.get('/seller/orders/:sellerId', orderController.getSellerOrders)
orderRouter.get('/seller/order/:orderId', orderController.getSellerOrder)
orderRouter.put(
  '/seller/order-status/update/:orderId',
  orderController.sellerOrderStatusUpdate
)
