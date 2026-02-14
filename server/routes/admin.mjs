import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.mjs'
import logger from '../utils/logger.mjs'

const router = express.Router()

// Dashboard stats endpoint
router.get('/dashboard-stats', asyncHandler(async (req, res) => {
  logger.request(req, 'Fetching dashboard statistics')
  
  const { products, orders, users } = req.app.locals.collections
  
  const totalProducts = await products.countDocuments({})
  const pendingOrders = await orders.countDocuments({ status: 'pending' })
  const activeCustomers = await users.countDocuments({})
  
  // Calculate monthly revenue
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const revenueResult = await orders.aggregate([
    {
      $match: {
        createdAt: { $gte: firstDayOfMonth },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' }
      }
    }
  ]).toArray()
  
  const monthlyRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0
  
  const stats = {
    totalProducts,
    pendingOrders,
    activeCustomers,
    monthlyRevenue
  }
  
  logger.success('Dashboard stats retrieved', { requestId: req.requestId, ...stats })
  
  return res.json(stats)
}))

export default router
