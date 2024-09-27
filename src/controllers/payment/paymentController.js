/* eslint-disable no-undef */

import { Types } from 'mongoose'
import stripe from 'stripe'
import { v4 as uuid } from 'uuid'
import { STRIPE_KEY } from '../../config.js'
import SellerWallets from '../../models/seller-wallets.js'
import Seller from '../../models/seller.js'
import Stripe from '../../models/stripe.js'
import Withdraw from '../../models/withdraw.js'
import { responseReturn } from '../../utils/response.js'

const stripeRef = new stripe(STRIPE_KEY)

export class PaymentController {
  createStripeConnectAccount = async (req, res) => {
    const { id } = req

    try {
      await Stripe.deleteOne({ sellerId: id })

      const account = await stripeRef.accounts.create({ type: 'express' })

      const accountLink = await stripeRef.accountLinks.create({
        account: account.id,
        refresh_url: 'http://localhost:3001/refresh',
        return_url: `http://localhost:3001/success?activeCode=${uuid()}`,
        type: 'account_onboarding',
      })

      await Stripe.create({
        sellerId: id,
        stripeId: account.id,
        code: uuid(),
      })

      responseReturn(res, 200, { url: accountLink.url })
    } catch (error) {
      console.error('Error in createStripeConnectAccount', error)

      responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  activeStripeConnectAccount = async (req, res) => {
    const { code } = req.params
    const { id } = req

    if (!code) {
      return responseReturn(res, 400, { error: 'Code is required' })
    }

    try {
      const userStripeInfo = await Stripe.findOne({ code })

      if (userStripeInfo) {
        await Seller.findByIdAndUpdate(id, { payment: 'active' })

        return responseReturn(res, 200, {
          message: 'Payment method activated successfully',
        })
      }

      return responseReturn(res, 404, {
        error: 'Invalid code or payment activation failed',
      })
    } catch (error) {
      console.error('Error in activeStripeConnectAccount:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  getSellerPaymentDetails = async (req, res) => {
    const { sellerId } = req.params

    if (!sellerId) {
      return responseReturn(res, 400, { error: 'sellerId is required' })
    }

    try {
      const [payments, pendingWithdraws, successWithdraws] = await Promise.all([
        SellerWallets.find({ sellerId }),
        Withdraw.find({ sellerId, status: 'pending' }),
        Withdraw.find({ sellerId, status: 'success' }),
      ])

      const totalAmount = this._sumAmount(payments)
      const pendingAmount = this._sumAmount(pendingWithdraws)
      const withdrawAmount = this._sumAmount(successWithdraws)

      const availableAmount = Math.max(
        0,
        totalAmount - (pendingAmount + withdrawAmount)
      )

      return responseReturn(res, 200, {
        totalAmount,
        pendingAmount,
        withdrawAmount,
        availableAmount,
        pendingWithdraws,
        successWithdraws,
      })
    } catch (error) {
      console.error('Error in getSellerPaymentDetails:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  withdrawRequest = async (req, res) => {
    const { amount, sellerId } = req.body

    if (!amount || !sellerId) {
      return responseReturn(res, 400, {
        error: 'Amount and sellerId are required',
      })
    }

    const parsedAmount = parseFloat(amount)

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return responseReturn(res, 400, {
        error: 'Invalid amount provided. Must be a positive number.',
      })
    }

    try {
      const withdrawalRequest = await Withdraw.create({
        sellerId,
        amount: parsedAmount,
      })

      return responseReturn(res, 200, {
        withdrawalRequest,
        message: 'Withdrawal request created successfully',
      })
    } catch (error) {
      console.error('Error in withdrawRequest:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  getPaymentRequest = async (_, res) => {
    try {
      const withdrawalRequest = await Withdraw.find({ status: 'pending' })

      return responseReturn(res, 200, { withdrawalRequest })
    } catch (error) {
      console.error('Error in getPaymentRequest:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  paymentRequestConfirm = async (req, res) => {
    const { paymentId } = req.body

    if (!paymentId) {
      return responseReturn(res, 400, { error: 'Payment ID is required' })
    }

    try {
      const [payment, stripeInfo] = await Promise.all([
        Withdraw.findById(paymentId),
        Withdraw.findById(paymentId).then((payment) =>
          Stripe.findOne({ sellerId: new Types.ObjectId(payment.sellerId) })
        ),
      ])

      if (!payment) {
        return responseReturn(res, 404, { error: 'Payment not found' })
      }

      if (!stripeInfo?.stripeId) {
        return responseReturn(res, 404, {
          error: 'Stripe account not found for seller',
        })
      }

      await stripeRef.transfers.create({
        amount: payment.amount * 100,
        currency: 'usd',
        destination: stripeInfo.stripeId,
      })

      await Withdraw.findByIdAndUpdate(paymentId, { status: 'success' })

      return responseReturn(res, 200, {
        message: 'Payment request confirmed successfully',
      })
    } catch (error) {
      console.error('Error in paymentRequestConfirm:', error)

      return responseReturn(res, 500, { error: 'Internal server error' })
    }
  }

  _sumAmount = (data) => data.reduce((sum, record) => sum + record.amount, 0)
}
