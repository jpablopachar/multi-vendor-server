import jwt from 'jsonwebtoken'

import { SECRET } from '../config.js'

export const createToken = (data) =>
  jwt.sign(data, SECRET, { expiresIn: '1h' })
