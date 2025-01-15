import Deposit from '../models/Deposits.js'
import User from '../models/User.js'
import dotenv from 'dotenv'
import { saveTransaction } from '../services/savingtransaction.js'
dotenv.config()

// Create a new deposit
export const createDeposit = async (req, res, next) => {
  try {
    const { userId, amount, reference } = req.body

    // Validate required fields
    if (!userId || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID and amount are required.'
      })
    }

    // // Generate a unique reference ID
    // const referenceId = await generateUniqueReference()

    // Save the deposit transaction
    const transactionData = {
      userId,
      type: 'deposit',
      amount,
      reference
    }

    const result = await saveTransaction(transactionData)

    if (result.status === 'error') {
      return res.status(500).json(result)
    }

    // Update user's account balance
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.'
      })
    }

    user.balance += amount
    await user.save()

    res.status(201).json({
      status: 'success',
      message: 'Deposit created and balance updated successfully.',
      data: result.data
    })
  } catch (error) {
    next(error)
  }
}

// Fetch deposit details
export const getDepositDetails = async (req, res, next) => {
  try {
    const { id } = req.bddy

    const deposit = await Deposit.findByPk(id)

    if (!deposit) {
      return res.status(404).json({
        status: 'error',
        message: 'Deposit not found.'
      })
    }

    res.status(200).json({
      status: 'success',
      data: deposit
    })
  } catch (error) {
    next(error)
  }
}

// Update deposit status
export const updateDepositStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const deposit = await Deposit.findByPk(id)

    if (!deposit) {
      return res.status(404).json({
        status: 'error',
        message: 'Deposit not found.'
      })
    }

    deposit.status = status
    await deposit.save()

    res.status(200).json({
      status: 'success',
      message: 'Deposit status updated successfully.',
      data: deposit
    })
  } catch (error) {
    next(error)
  }
}

export const processRequest = async (req, res) => {
  const { user_id, amount } = req.body
  if (!user_id) {
    return res.status(400).json({
      status: 'error',
      message: 'user id is required'
    })
  }
  const user = await User.findOne({ where: { id: user_id } })
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    })
  }
  if (amount) {
    // Replace this with your actual public key
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY

    // Encode the key in Base64
    const encodedPublicKey = Buffer.from(publicKey).toString('base64')

    // Add success data to the output
    output.result = 'success'
    output.email = user.email
    output.amount = amount
    output.publicKey = encodedPublicKey
  } else {
    // Handle the error case
    output.result = 'error'
    output.message = 'Invalid email or amount.'
  }

  // Send the output as JSON
  res.status(201).json(output)
}
