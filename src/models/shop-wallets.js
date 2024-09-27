import { Schema, model } from 'mongoose'

const shopWalletsSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
)

export default model('Shop_Wallets', shopWalletsSchema)
