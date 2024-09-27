import { Schema, model } from 'mongoose'

const adminSellerMessageSchema = new Schema(
  {
    senderName: {
      type: String,
      required: true,
    },
    senderId: {
      type: String,
      default: '',
    },
    receiverId: {
      type: String,
      default: '',
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

export default model('Admin_Seller_Message', adminSellerMessageSchema)
