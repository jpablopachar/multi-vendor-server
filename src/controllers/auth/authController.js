/* eslint-disable no-undef */

import { compare, hash } from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import formidable from 'formidable'
import { NODE_ENV } from '../../config.js'
import Admin from '../../models/admin.js'
import SellerCustomers from '../../models/chat/seller-customer.js'
import Seller from '../../models/seller.js'
import { responseReturn } from '../../utils/response.js'
import { createToken } from '../../utils/tokenCreate.js'

const isProd = NODE_ENV === 'prod'

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
})

export class AuthController {
  adminLogin = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password)
      return responseReturn(res, 400, { error: 'Email and password required' })

    try {
      const admin = await Admin.findOne({ email }).select('+password')

      if (!admin) return responseReturn(res, 404, { error: 'Email not found' })

      return this._handleLogin(admin, password, res)
    } catch (error) {
      console.error('Error in adminLogin', error)

      return responseReturn(res, 500, { error: 'Error logging admin' })
    }
  }

  sellerLogin = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password)
      return responseReturn(res, 400, { error: 'Email and password required' })

    try {
      const seller = await Seller.findOne({ email }).select('+password')

      if (!seller) return responseReturn(res, 404, { error: 'Email not found' })

      return this._handleLogin(seller, password, res)
    } catch (error) {
      console.error('Error in sellerLogin', error)

      return responseReturn(res, 500, { error: 'Error logging seller' })
    }
  }

  sellerRegister = async (req, res) => {
    const { email, name, password } = req.body

    if (!email || !name || !password)
      return responseReturn(res, 400, {
        error: 'Email, name and password are required',
      })

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email))
      return responseReturn(res, 400, { error: 'Invalid email' })

    try {
      const user = await Seller.findOne({ email })

      if (user)
        return responseReturn(res, 400, { error: 'Email already registered' })

      const seller = await Seller.create({
        name,
        email,
        password: await hash(password, 10),
        method: 'local',
        shopInfo: {},
      })

      await SellerCustomers.create({ myId: seller.id })

      const token = createToken({ id: seller.id, role: seller.role })

      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'None' : 'Lax',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      return responseReturn(res, 201, { token, message: 'Register successful' })
    } catch {
      console.error('Error in sellerRegister', error)

      return responseReturn(res, 500, { error: 'Error register seller' })
    }
  }

  getUser = async (req, res) => {
    const { id, role } = req

    try {
      if (role === 'admin') {
        const user = await Admin.findById(id)

        return responseReturn(res, 200, { userInfo: user })
      } else {
        const seller = await Seller.findById(id)

        return responseReturn(res, 200, { userInfo: seller })
      }
    } catch {
      console.error('Error in getUser', error)

      return responseReturn(res, 500, { error: 'Error get user' })
    }
  }

  profileImageUpload = async (req, res) => {
    const { id } = req

    const form = formidable({ multiples: true })

    form.parse(req, async (err, _, files) => {
      const { image } = files

      try {
        const result = await cloudinary.uploader.upload(image[0].filepath, {
          folder: 'profile',
        })

        if (!result)
          return responseReturn(res, 404, { error: 'Image upload failed' })

        await Seller.findByIdAndUpdate(id, { image: result.secure_url })

        const userInfo = await Seller.findById(id)

        return responseReturn(res, 201, {
          message: 'Profile image upload successfully',
          userInfo,
        })
      } catch (error) {
        console.error('Error in profileImageUpload', error)

        return responseReturn(res, 500, { error: 'Error upload image profile' })
      }
    })
  }

  profileInfoAdd = async (req, res) => {
    const { division, district, shopName, subDistrict } = req.body
    const { id } = req

    if (!division || !district || !shopName || !subDistrict)
      return responseReturn(res, 400, {
        error: 'Division, district, shopName and subDistrict are required',
      })

    try {
      await Seller.findByIdAndUpdate(id, {
        shopInfo: {
          division,
          district,
          shopName,
          subDistrict,
        },
      })

      const userInfo = await Seller.findById(id)

      return responseReturn(res, 200, {
        message: 'Profile info add successful',
        userInfo,
      })
    } catch (error) {
      console.error('Error in profileInfoAdd', error)

      return responseReturn(res, 500, { error: 'Error add info' })
    }
  }

  logout = async (req, res) => {
    try {
      res.cookie('accessToken', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'None' : 'Lax',
      })

      return responseReturn(res, 200, { message: 'Logout successful' })
    } catch (error) {
      console.error('Error in logout', error)

      return responseReturn(res, 500, { error: 'Error logout' })
    }
  }

  _handleLogin = async (user, password, res) => {
    const match = await compare(password, user.password)

    if (!match) return responseReturn(res, 401, { error: 'Invalid password' })

    const token = createToken({ id: user.id, role: user.role })

    res.cookie('accessToken', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
    })

    return responseReturn(res, 200, { token, message: 'Login successful' })
  }
}
