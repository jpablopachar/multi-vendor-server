import jwt from 'jsonwebtoken'

import { SECRET } from '../config.js'
import { responseReturn } from '../utils/response.js'

export const authMiddleware = (req, res, next) => {
  const { accessToken } = req.cookies

  if (!accessToken)
    return responseReturn(res, 409, { error: 'Please Login first' })

  try {
    const decodeToken = jwt.verify(accessToken, SECRET)

    req.role = decodeToken.role
    req.id = decodeToken.id

    next()
  } catch {
    return responseReturn(res, 409, { error: 'Please Login' })
  }
}
