import express from 'express'
import { ObjectId } from 'mongodb'
import { validateObjectId } from '../middleware/validators.mjs'
import { asyncHandler } from '../middleware/errorHandler.mjs'
import logger from '../utils/logger.mjs'

const router = express.Router()

// Get all orders
router.get('/', asyncHandler(async (req, res) => {
  logger.request(req, 'Fetching all orders')
  
  const orders = req.app.locals.collections.orders
  const allOrders = await orders.find({}).sort({ createdAt: -1 }).toArray()
  
  const normalized = allOrders.map(o => ({
    ...o,
    _id: o._id.toString(),
    createdAt: o.createdAt ? new Date(o.createdAt) : new Date()
  }))
  
  logger.success(`Retrieved ${normalized.length} orders`, { requestId: req.requestId, count: normalized.length })
  return res.json(normalized)
}))

// Create order
router.post('/', asyncHandler(async (req, res) => {
  logger.request(req, 'Creating new order')
  logger.debug('Order data', { 
    requestId: req.requestId,
    customerEmail: req.body.customerEmail,
    itemCount: req.body.items?.length,
    totalAmount: req.body.totalAmount
  })
  
  const orderData = {
    ...req.body,
    status: 'pending',
    createdAt: new Date()
  }
  
  const orders = req.app.locals.collections.orders
  const result = await orders.insertOne(orderData)
  
  logger.success(`Order created: ${result.insertedId}`, { 
    requestId: req.requestId,
    orderId: result.insertedId.toString(),
    status: 'pending'
  })
  
  return res.json({ ...orderData, _id: result.insertedId.toString() })
}))

// Update order status
router.patch('/:id/status',
  validateObjectId('id'),
  asyncHandler(async (req, res) => {
    const { status } = req.body
    
    if (!status) {
      return res.status(400).json({ 
        error: 'Status is required',
        field: 'status'
      })
    }
    
    logger.request(req, `Updating order status: ${req.params.id} -> ${status}`)
    
    const orders = req.app.locals.collections.orders
    const result = await orders.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } }
    )
    
    if (result.matchedCount === 0) {
      logger.warn('Order not found for status update', { requestId: req.requestId, orderId: req.params.id })
      return res.status(404).json({ error: 'Order not found' })
    }
    
    logger.success(`Order status updated: ${req.params.id} -> ${status}`, { 
      requestId: req.requestId,
      orderId: req.params.id,
      newStatus: status
    })
    
    return res.json({ success: true })
  })
)

export default router
