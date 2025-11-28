import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import path from 'path'

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
app.use(cors())
app.use(express.json())

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

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
