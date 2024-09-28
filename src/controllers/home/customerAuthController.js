/* eslint-disable no-undef */

import { compare, hash } from 'bcrypt'
import { NODE_ENV } from '../../config.js'
import SellerCustomer from '../../models/chat/seller-customer.js'
import Customer from '../../models/customer.js'
import { responseReturn } from '../../utils/response.js'
import { createToken } from '../../utils/tokenCreate.js'

const isProd = NODE_ENV === 'prod'

export class CustomerAuthController {
  customerRegister = async (req, res) => {
    const { name, email, password } = req.body

    try {
      const customer = await Customer.findOne({ email })

      if (customer) {
        responseReturn(res, 404, { error: 'Email already exists' })
      } else {
        const createCustomer = await Customer.create({
          name: name.trim(),
          email: email.trim(),
          password: await hash(password, 10),
          method: 'manual',
        })

        await SellerCustomer.create({ myId: createCustomer.id })

        const token = await createToken({
          id: createCustomer.id,
          name: createCustomer.name,
          email: createCustomer.email,
          method: createCustomer.method,
        })

        res.cookie('customerToken', token, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? 'None' : 'Lax',
        })

        responseReturn(res, 201, {
          message: 'User register successfully',
          token,
        })
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  customerLogin = async (req, res) => {
    const { email, password } = req.body

    try {
      const customer = await Customer.findOne({ email }).select('+password')

      if (customer) {
        const match = await compare(password, customer.password)

        if (match) {
          const token = createToken({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            method: customer.method,
          })

          res.cookie('customerToken', token, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'None' : 'Lax',
          })

          responseReturn(res, 201, {
            message: 'User login successfully',
            token,
          })
        } else {
          responseReturn(res, 404, { error: 'Password incorrect' })
        }
      } else {
        responseReturn(res, 404, { error: 'Email not found' })
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  customerLogout = async (req, res) => {
    res.cookie('customerToken', '', {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
    })

    responseReturn(res, 200, { message: 'User logout successfully' })
  }
}
