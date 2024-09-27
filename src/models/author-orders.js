import { Schema, model } from 'mongoose'

const authorOrdersSchema = new Schema(
  {
    orderId: {
      type: Schema.ObjectId,
      required: true,
    },
    sellerId: {
      type: Schema.ObjectId,
      required: true,
    },
    products: {
      type: Array,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      required: true,
    },
    shippingInfo: {
      type: String,
      required: true,
    },
    deliveryStatus: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

export default model('Author_Orders', authorOrdersSchema)
