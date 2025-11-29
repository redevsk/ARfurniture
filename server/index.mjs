import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
}

const normalizeUser = (doc = {}) => ({
  _id: doc._id?.toString(),
  email: doc.email,
  fname: doc.fname,
  mname: doc.mname,
  lname: doc.lname,
  name: [doc.fname, doc.mname, doc.lname].filter(Boolean).join(' '),
  role: 'user',
  contactNumber: doc.contactNumber || '',
  address: doc.address || []
})

const normalizeAdmin = (doc = {}) => ({
  _id: doc._id?.toString(),
  email: doc.email,
  username: doc.username,
  fname: doc.fname,
  mname: doc.mname || '',
  lname: doc.lname,
  name: [doc.fname, doc.mname, doc.lname].filter(Boolean).join(' '),
  role: 'admin'
})

const app = express()

// Manual CORS middleware - required for dev tunnels which strip headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ extended: true, limit: '200mb' }))

// Serve static files from products folder
const productsPath = path.join(__dirname, '..', 'products')
app.use('/products', express.static(productsPath))

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI env var is required')
  process.exit(1)
}

const client = new MongoClient(uri)
await client.connect()
const db = client.db('arecommerce')
const users = db.collection('users')
const admins = db.collection('admins')
const products = db.collection('products')
const orders = db.collection('orders')
const banners = db.collection('banners')

console.log('✓ Connected to MongoDB')

// Customer Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email = '', password = '', fname = '', mname = '', lname = '', contactNumber = '' } = req.body || {}
    const normalizedEmail = email.trim().toLowerCase()
    const first = fname.trim()
    const middle = mname.trim()
    const last = lname.trim()
    if (!normalizedEmail || !password || !first || !last) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const hash = await bcrypt.hash(password, 10)
    const doc = {
      email: normalizedEmail,
      password: hash,
      fname: first,
      mname: middle,
      lname: last,
      contactNumber: contactNumber.trim(),
      address: []
    }
    const { insertedId } = await users.insertOne(doc)
    return res.json(normalizeUser({ ...doc, _id: insertedId }))
  } catch (e) {
    if (e && e.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' })
    }
    console.error('Signup error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Customer Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {}
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) return res.status(400).json({ error: 'Missing credentials' })
    const user = await users.findOne({ email: normalizedEmail })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    console.log('✓ Customer login successful:', normalizedEmail)
    return res.json(normalizeUser(user))
  } catch (e) {
    console.error('Customer login error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Admin Login - accepts email OR username
app.post('/api/admins/login', async (req, res) => {
  try {
    const { identifier = '', password = '' } = req.body || {}
    const normalizedIdentifier = identifier.trim().toLowerCase()
    
    if (!normalizedIdentifier || !password) {
      console.log('✗ Admin login failed: Missing credentials')
      return res.status(400).json({ error: 'Missing credentials' })
    }
    
    console.log('→ Admin login attempt for:', normalizedIdentifier)
    
    // Search by email OR username (both case-insensitive)
    const admin = await admins.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier }
      ]
    })
    
    if (!admin) {
      console.log('✗ Admin not found for identifier:', normalizedIdentifier)
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    console.log('→ Admin found, verifying password...')
    const ok = await bcrypt.compare(password, admin.password)
    
    if (!ok) {
      console.log('✗ Invalid password for:', normalizedIdentifier)
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    console.log('✓ Admin login successful:', admin.email, '(', admin.username, ')')
    return res.json(normalizeAdmin(admin))
  } catch (e) {
    console.error('✗ Admin login error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`✓ Auth server listening on http://localhost:${port}`)
})

// =====================
// PRODUCTS API
// =====================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const allProducts = await products.find({}).toArray()
    const normalized = allProducts.map(p => ({
      ...p,
      _id: p._id.toString(),
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
    }))
    return res.json(normalized)
  } catch (e) {
    console.error('Get products error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    const product = await products.findOne({ _id: new ObjectId(req.params.id) })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    return res.json({
      ...product,
      _id: product._id.toString(),
      createdAt: product.createdAt ? new Date(product.createdAt) : new Date()
    })
  } catch (e) {
    console.error('Get product error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdAt: new Date()
    }
    const result = await products.insertOne(productData)
    return res.json({ ...productData, _id: result.insertedId.toString() })
  } catch (e) {
    console.error('Create product error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    const { _id, ...updates } = req.body
    await products.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    )
    const updated = await products.findOne({ _id: new ObjectId(req.params.id) })
    return res.json({ ...updated, _id: updated._id.toString() })
  } catch (e) {
    console.error('Update product error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    await products.deleteOne({ _id: new ObjectId(req.params.id) })
    return res.json({ success: true })
  } catch (e) {
    console.error('Delete product error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// =====================
// FILE UPLOAD API
// =====================

// Helper to sanitize folder names
const sanitizeFolderName = (name) => {
  if (!name) return 'uncategorized'
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
    .substring(0, 50)             // Limit length
    || 'uncategorized'
}

// Configure multer for file storage with dynamic product folders
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productFolder = sanitizeFolderName(req.body.productName || req.query.productName)
    const dir = path.join(__dirname, '..', 'products', 'images', productFolder)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    req.productFolder = productFolder  // Store for later use
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
    cb(null, uniqueName)
  }
})

const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productFolder = sanitizeFolderName(req.body.productName || req.query.productName)
    const dir = path.join(__dirname, '..', 'products', '3dmodels', productFolder)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    req.productFolder = productFolder  // Store for later use
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.glb'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
    cb(null, uniqueName)
  }
})

const uploadImage = multer({ 
  storage: imageStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

const uploadModel = multer({ 
  storage: modelStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for 3D models
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.glb')) {
      cb(null, true)
    } else {
      cb(new Error('Only .glb files are allowed'))
    }
  }
})

// Upload image endpoint
app.post('/api/upload/image', uploadImage.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    const productFolder = req.productFolder || 'uncategorized'
    const url = `/products/images/${productFolder}/${req.file.filename}`
    console.log('✓ Image uploaded:', url)
    return res.json({ url })
  } catch (e) {
    console.error('Image upload error:', e)
    return res.status(500).json({ error: 'Upload failed' })
  }
})

// Upload GLB model endpoint
app.post('/api/upload/model', uploadModel.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    const productFolder = req.productFolder || 'uncategorized'
    const url = `/products/3dmodels/${productFolder}/${req.file.filename}`
    console.log('✓ Model uploaded:', url)
    return res.json({ url })
  } catch (e) {
    console.error('Model upload error:', e)
    return res.status(500).json({ error: 'Upload failed' })
  }
})

// =====================
// ORDERS API
// =====================

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const allOrders = await orders.find({}).sort({ createdAt: -1 }).toArray()
    const normalized = allOrders.map(o => ({
      ...o,
      _id: o._id.toString(),
      createdAt: o.createdAt ? new Date(o.createdAt) : new Date()
    }))
    return res.json(normalized)
  } catch (e) {
    console.error('Get orders error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      status: 'pending',
      createdAt: new Date()
    }
    const result = await orders.insertOne(orderData)
    return res.json({ ...orderData, _id: result.insertedId.toString() })
  } catch (e) {
    console.error('Create order error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Update order status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    const { status } = req.body
    await orders.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status } }
    )
    return res.json({ success: true })
  } catch (e) {
    console.error('Update order status error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// =====================
// BANNERS API
// =====================

// Get all banners
app.get('/api/banners', async (req, res) => {
  try {
    const allBanners = await banners.find({}).toArray()
    const normalized = allBanners.map(b => ({
      ...b,
      _id: b._id.toString()
    }))
    return res.json(normalized)
  } catch (e) {
    console.error('Get banners error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Create banner
app.post('/api/banners', async (req, res) => {
  try {
    const result = await banners.insertOne(req.body)
    return res.json({ ...req.body, _id: result.insertedId.toString() })
  } catch (e) {
    console.error('Create banner error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Update banner
app.put('/api/banners/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    const { _id, ...updates } = req.body
    await banners.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    )
    const updated = await banners.findOne({ _id: new ObjectId(req.params.id) })
    return res.json({ ...updated, _id: updated._id.toString() })
  } catch (e) {
    console.error('Update banner error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Delete banner
app.delete('/api/banners/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    await banners.deleteOne({ _id: new ObjectId(req.params.id) })
    return res.json({ success: true })
  } catch (e) {
    console.error('Delete banner error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
