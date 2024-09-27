import { Schema, model } from 'mongoose'

const sellerCustomerMessageSchema = new Schema(
  {
    senderName: {
      type: String,
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    receiverId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'unseen',
    },
  },
  { timestamps: true }
)

export default model('Seller_Customer_Message', sellerCustomerMessageSchema)
