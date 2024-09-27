/* eslint-disable no-undef */

import dotenv from 'dotenv'

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'dev'}` })

export const NODE_ENV = process.env.NODE_ENV || 'dev'
export const PORT = process.env.PORT || 3000
export const DB_URL = process.env.DB_URL
export const SECRET = process.env.SECRET
export const STRIPE_KEY = process.env.STRIPE_KEY
export const CLIENT_REACT_URL = process.env.CLIENT_REACT_URL
export const CLIENT_ANGULAR_URL = process.env.CLIENT_ANGULAR_URL
export const FRONTEND_REACT_URL = process.env.FRONTEND_REACT_URL
export const FRONTEND_ANGULAR_URL = process.env.FRONTEND_ANGULAR_URL
