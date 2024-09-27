import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { createServer } from 'http'
import morgan from 'morgan'
import {
  CLIENT_ANGULAR_URL,
  CLIENT_REACT_URL,
  FRONTEND_REACT_URL,
  NODE_ENV,
  PORT,
} from './config.js'
import { authRouter } from './routes/auth/authRoutes.js'
import { chatRouter } from './routes/chat/chatRoutes.js'
import { categoryRouter } from './routes/dashboard/categoryRoutes.js'
import { dashboardRouter } from './routes/dashboard/dashboardRoute.js'
import { productRouter } from './routes/dashboard/productRoutes.js'
import { sellerRouter } from './routes/dashboard/sellerRoutes.js'
import { cardRouter } from './routes/home/cardRoutes.js'
import { customerAuthRouter } from './routes/home/customerAuthRoutes.js'
import { homeRouter } from './routes/home/homeRoutes.js'
import { orderRouter } from './routes/order/orderRoutes.js'
import { paymentRouter } from './routes/payment/paymentRoutes.js'
import { socketConnection } from './socket/index.js'
import { dbConnect } from './utils/db.js'

// import { swaggerDocs } from './routes/swagger.js'

const corsOptions = {
  origin: [CLIENT_REACT_URL, FRONTEND_REACT_URL, CLIENT_ANGULAR_URL],
  credentials: true,
}

const app = express()
const server = createServer(app)

socketConnection(server)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(cors(corsOptions))

app.use('/api/chat', chatRouter)
app.use('/api/auth', authRouter)
app.use('/api', categoryRouter)
app.use('/api', productRouter)
app.use('/api', sellerRouter)
app.use('/api/home', homeRouter)
app.use('/api/customer', customerAuthRouter)
app.use('/api/home/product', cardRouter)
app.use('/api', orderRouter)
app.use('/api', dashboardRouter)
app.use('/api/payment', paymentRouter)

dbConnect().then(() => {
  server.listen(PORT, () => {
    const message =
      NODE_ENV === 'prod'
        ? 'Server connected'
        : `Server is running on http://localhost:${PORT}`
    // eslint-disable-next-line no-undef
    console.log(message)

    // swaggerDocs(app, PORT)
  })
})
