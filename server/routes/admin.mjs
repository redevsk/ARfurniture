import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.mjs'
import logger from '../utils/logger.mjs'
import bcrypt from 'bcryptjs'
import { normalizeAdmin } from '../utils/normalize.mjs'
import { validateRequiredFields, validateEmail, validatePassword } from '../middleware/validators.mjs'

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

// =====================
// STAFF MANAGEMENT
// =====================

// List all admins
router.get('/staff', asyncHandler(async (req, res) => {
  logger.request(req, 'Fetching all staff members')
  
  const adminsCollection = req.app.locals.collections.admins
  const admins = await adminsCollection.find({}).toArray()
  
  // Normalize to remove passwords
  const safeAdmins = admins.map(admin => normalizeAdmin(admin))
  
  logger.success(`Retrieved ${safeAdmins.length} staff members`, { requestId: req.requestId })
  return res.json(safeAdmins)
}))

// Add new admin
router.post('/staff', 
  validateRequiredFields(['fname', 'lname', 'email', 'username', 'password', 'role']),
  validateEmail,
  validatePassword,
  asyncHandler(async (req, res) => {
    const { fname, mname, lname, email, username, password, role } = req.body
    
    logger.request(req, `Creating new staff member: ${email}`)

    // Validate role
    if (!['admin', 'superadmin'].includes(role)) {
       return res.status(400).json({ error: 'Invalid role. Must be "admin" or "superadmin".' })
    }
    
    const adminsCollection = req.app.locals.collections.admins
    
    // Check if email or username already exists
    const existing = await adminsCollection.findOne({ 
      $or: [
        { email: email.toLowerCase() }, 
        { username: username.toLowerCase() }
      ] 
    })
    
    if (existing) {
      return res.status(400).json({ error: 'Email or Username already exists' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const newAdmin = {
      fname,
      mname: mname || '',
      lname,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      role,
      createdAt: new Date()
    }
    
    const result = await adminsCollection.insertOne(newAdmin)
    
    logger.success(`Staff member created: ${email}`, { requestId: req.requestId, id: result.insertedId })
    
    return res.status(201).json(normalizeAdmin({ ...newAdmin, _id: result.insertedId }))
  })
)

export default router
