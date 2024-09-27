/* eslint-disable no-undef */

import { Server } from 'socket.io'
import {
  CLIENT_ANGULAR_URL,
  CLIENT_REACT_URL,
  FRONTEND_REACT_URL,
} from '../config.js'

export const socketConnection = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [CLIENT_REACT_URL, FRONTEND_REACT_URL, CLIENT_ANGULAR_URL],
      credentials: true,
    },
  })

  let allCustomers = new Map()
  let allSellers = new Map()
  let admin = {}

  const addUser = (customerId, socketId, userInfo) => {
    if (!allCustomers.has(customerId))
      allCustomers.set(customerId, { socketId, userInfo })
  }

  const addSeller = (sellerId, socketId, userInfo) => {
    if (!allSellers.has(sellerId)) {
      allSellers.set(sellerId, { socketId, userInfo })
    }
  }

  const findCustomer = (customerId) => {
    return allCustomers.get(customerId)
  }

  const findSeller = (sellerId) => {
    return allSellers.get(sellerId)
  }

  const remove = (socketId) => {
    allCustomers.forEach((value, key) => {
      if (value.socketId === socketId) allCustomers.delete(key)
    })

    allSellers.forEach((value, key) => {
      if (value.socketId === socketId) allSellers.delete(key)
    })
  }

  io.on('connection', (socket) => {
    console.log('Socket server running..')

    socket.on('addUser', (customerId, userInfo) => {
      addUser(customerId, socket.id, userInfo)

      io.emit('activeSellers', Array.from(allSellers.values()))
    })

    socket.on('addSeller', (sellerId, userInfo) => {
      addSeller(sellerId, socket.id, userInfo)

      io.emit('activeSellers', Array.from(allSellers.values()))
    })

    socket.on('sendSellerMessage', (message) => {
      try {
        const customer = findCustomer(message.receiverId)

        if (customer) {
          socket.to(customer.socketId).emit('sellerMessage', message)
        } else {
          console.error('Customer not found')
        }
      } catch (error) {
        console.error('Error sending seller message:', error)
      }
    })

    socket.on('sendCustomerMessage', (message) => {
      try {
        const seller = findSeller(message.receiverId)

        if (seller) {
          socket.to(seller.socketId).emit('customerMessage', message)
        } else {
          console.error('Seller not found')
        }
      } catch (error) {
        console.error('Error sending customer message:', error)
      }
    })

    socket.on('sendMessageAdminToSeller', (message) => {
      try {
        const seller = findSeller(message.receiverId)

        if (seller) {
          socket.to(seller.socketId).emit('receiverAdminMessage', message)
        } else {
          console.error('Seller not found')
        }
      } catch (error) {
        console.error('Error sending admin message:', error)
      }
    })

    socket.on('sendMessageSellerToAdmin', (message) => {
      try {
        if (admin.socketId) {
          socket.to(admin.socketId).emit('receiverSellerMessage', message)
        } else {
          console.error('Admin not connected')
        }
      } catch (error) {
        console.error('Error sending message to admin:', error)
      }
    })

    socket.on('addAdmin', (adminInfo) => {
      delete adminInfo.email
      delete adminInfo.password

      admin = { ...adminInfo, socketId: socket.id }

      io.emit('activeSellers', Array.from(allSellers.values()))
    })

    socket.on('disconnect', () => {
      console.log('User disconnected..')

      remove(socket.id)

      io.emit('activeSellers', Array.from(allSellers.values()))
    })
  })
}
