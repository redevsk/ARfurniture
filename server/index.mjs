import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import multer from 'multer'
import crypto from 'crypto'
import { sendPasswordResetEmail, sendPasswordResetConfirmationEmail } from './email-helper.mjs'
import { createClient } from '@supabase/supabase-js'

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

// =====================
// FORGOT PASSWORD API
// =====================

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// POST /api/forgot-password - Request password reset code
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' })
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if user with this email exists
    const user = await users.findOne({ email: normalizedEmail })

    // For security, don't reveal if email exists or not
    // Always return success message
    if (!user) {
      // Still return success but don't send email
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset code has been sent.'
      })
    }

    // Generate 6-digit verification code
    const resetCode = crypto.randomInt(100000, 999999).toString()

    // Store reset code in database with 15-minute expiration
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password_reset_code: resetCode,
          password_reset_token: resetToken,
          password_reset_expires: expiresAt,
          password_reset_attempts: 0,
          updated_at: new Date()
        }
      }
    )

    // Send email (async, don't wait)
    const fullName = [user.fname, user.lname].filter(Boolean).join(' ')
    sendPasswordResetEmail({
      email: user.email,
      fullName: fullName,
      resetCode: resetCode
    }).catch(error => {
      console.error('Error sending password reset email:', error)
    })

    return res.json({
      success: true,
      resetToken: resetToken,
      message: 'If an account with this email exists, a password reset code has been sent.'
    })

  } catch (error) {
    console.error('Error in forgot password:', error)
    return res.status(500).json({ error: 'Failed to process password reset request' })
  }
})

// POST /api/forgot-password/verify-code - Verify reset code
app.post('/api/forgot-password/verify-code', async (req, res) => {
  try {
    const { resetToken, code } = req.body

    if (!resetToken || !code) {
      return res.status(400).json({ error: 'Reset token and code are required' })
    }

    // Find user with this reset token
    const user = await users.findOne({
      password_reset_token: resetToken
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    // Check if token has expired
    if (!user.password_reset_expires || new Date() > new Date(user.password_reset_expires)) {
      // Clean up expired reset data
      await users.updateOne(
        { _id: user._id },
        {
          $unset: {
            password_reset_code: '',
            password_reset_token: '',
            password_reset_expires: '',
            password_reset_attempts: ''
          }
        }
      )
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' })
    }

    // Check attempts (max 5 attempts)
    const attempts = user.password_reset_attempts || 0
    if (attempts >= 5) {
      // Clean up reset data after too many attempts
      await users.updateOne(
        { _id: user._id },
        {
          $unset: {
            password_reset_code: '',
            password_reset_token: '',
            password_reset_expires: '',
            password_reset_attempts: ''
          }
        }
      )
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new reset code.' })
    }

    // Verify code
    if (user.password_reset_code !== code) {
      // Increment attempts
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            password_reset_attempts: attempts + 1
          }
        }
      )
      return res.status(400).json({
        error: 'Invalid verification code',
        attemptsRemaining: 5 - (attempts + 1)
      })
    }

    // Code is valid - return success
    return res.json({
      success: true,
      message: 'Code verified successfully'
    })

  } catch (error) {
    console.error('Error verifying reset code:', error)
    return res.status(500).json({ error: 'Failed to verify code' })
  }
})

// POST /api/forgot-password/reset-password - Reset password with verified code
app.post('/api/forgot-password/reset-password', async (req, res) => {
  try {
    const { resetToken, code, newPassword } = req.body

    if (!resetToken || !code || !newPassword) {
      return res.status(400).json({ error: 'Reset token, code, and new password are required' })
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    // Find user with this reset token
    const user = await users.findOne({
      password_reset_token: resetToken,
      password_reset_code: code
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid reset token or code' })
    }

    // Check if token has expired
    if (!user.password_reset_expires || new Date() > new Date(user.password_reset_expires)) {
      // Clean up expired reset data
      await users.updateOne(
        { _id: user._id },
        {
          $unset: {
            password_reset_code: '',
            password_reset_token: '',
            password_reset_expires: '',
            password_reset_attempts: ''
          }
        }
      )
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset data
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updated_at: new Date()
        },
        $unset: {
          password_reset_code: '',
          password_reset_token: '',
          password_reset_expires: '',
          password_reset_attempts: ''
        }
      }
    )

    // Send confirmation email (async, don't wait)
    const fullName = [user.fname, user.lname].filter(Boolean).join(' ')
    sendPasswordResetConfirmationEmail({
      email: user.email,
      fullName: fullName
    }).catch(error => {
      console.error('Error sending password reset confirmation email:', error)
    })

    return res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    return res.status(500).json({ error: 'Failed to reset password' })
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

    console.log(`[UPDATE PRODUCT] Updating product ID: ${req.params.id}`)
    console.log(`[UPDATE PRODUCT] Received variants:`, updates.variants)

    // Get existing product to handle file cleanup
    const existingProduct = await products.findOne({ _id: new ObjectId(req.params.id) })

    console.log(`[UPDATE PRODUCT] Existing product variants in DB:`, existingProduct?.variants)

    if (existingProduct) {
      // 1. Handle main image replacement
      if (updates.image && existingProduct.image && updates.image !== existingProduct.image) {
        const oldPath = getPathFromUrl(existingProduct.image)
        if (oldPath) {
          console.log('Deleting old image:', oldPath)
          await supabase.storage.from(BUCKET_NAME).remove([oldPath])
        }
      }

      // 2. Handle additional images removal
      if (updates.images && Array.isArray(updates.images) && existingProduct.images && Array.isArray(existingProduct.images)) {
        const newImagesSet = new Set(updates.images)
        const imagesToDelete = existingProduct.images.filter(img => !newImagesSet.has(img))

        if (imagesToDelete.length > 0) {
          const pathsToDelete = imagesToDelete.map(url => getPathFromUrl(url)).filter(Boolean)
          if (pathsToDelete.length > 0) {
            console.log('Deleting removed additional images:', pathsToDelete)
            await supabase.storage.from(BUCKET_NAME).remove(pathsToDelete)
          }
        }
      }

      // 3. Handle AR model replacement
      if (updates.arModelUrl && existingProduct.arModelUrl && updates.arModelUrl !== existingProduct.arModelUrl) {
        const oldModelPath = getPathFromUrl(existingProduct.arModelUrl)
        if (oldModelPath) {
          console.log('Deleting old AR model:', oldModelPath)
          await supabase.storage.from(BUCKET_NAME).remove([oldModelPath])
        }
      }
      // 4. Handle variant asset cleanup
      if (updates.variants && Array.isArray(updates.variants) && existingProduct.variants && Array.isArray(existingProduct.variants)) {
        console.log(`[VARIANT CLEANUP] Checking variants for product "${existingProduct.name}"`)
        console.log(`[VARIANT CLEANUP] Old variants:`, existingProduct.variants.map(v => ({ id: v.id, name: v.name })))
        console.log(`[VARIANT CLEANUP] New variants:`, updates.variants.map(v => ({ id: v.id, name: v.name })))

        const newVariantsMap = new Map(updates.variants.map(v => [v.id, v]))

        for (const oldVariant of existingProduct.variants) {
          const newVariant = newVariantsMap.get(oldVariant.id)

          if (!newVariant) {
            console.log(`[VARIANT CLEANUP] 🗑️ VARIANT DELETED: "${oldVariant.name}" (ID: ${oldVariant.id})`)

            // 1. Delete specific files by URL (Bulletproof method)
            const assetsToPurge = []
            if (oldVariant.imageUrl) assetsToPurge.push(getPathFromUrl(oldVariant.imageUrl))
            if (oldVariant.arModelUrl) assetsToPurge.push(getPathFromUrl(oldVariant.arModelUrl))

            const filteredAssets = assetsToPurge.filter(Boolean)
            if (filteredAssets.length > 0) {
              console.log(`[STORAGE] Purging specific files for variant "${oldVariant.name}":`, filteredAssets)
              const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove(filteredAssets)
              if (removeError) {
                console.error(`[STORAGE] ❌ Error removing files:`, removeError)
              } else {
                console.log(`[STORAGE] ✅ Successfully removed ${filteredAssets.length} files`)
              }
            }

            // 2. Purge folders (handles both old and new structures)
            const productFolder = sanitizeFolderName(existingProduct.name)
            const vName = sanitizeFolderName(oldVariant.name)

            console.log(`[STORAGE] Attempting to delete folders for variant "${oldVariant.name}"`)
            console.log(`[STORAGE] Product folder: "${productFolder}", Variant folder: "${vName}"`)

            // Try new structure: product/variant/
            console.log(`[STORAGE] Trying new structure: ${productFolder}/${vName}`)
            await deleteSupabaseFolder(`${productFolder}/${vName}`)

            // Try old structure: product/variants/variant/
            console.log(`[STORAGE] Trying old structure: ${productFolder}/variants/${vName}`)
            await deleteSupabaseFolder(`${productFolder}/variants/${vName}`)
          } else {
            // Variant still exists, check for asset updates
            const assetsToRemove = []

            // Image changed?
            if (newVariant.imageUrl !== oldVariant.imageUrl && oldVariant.imageUrl) {
              assetsToRemove.push(getPathFromUrl(oldVariant.imageUrl))
            }

            // Model changed?
            if (newVariant.arModelUrl !== oldVariant.arModelUrl && oldVariant.arModelUrl) {
              assetsToRemove.push(getPathFromUrl(oldVariant.arModelUrl))
            }

            const filteredAssets = assetsToRemove.filter(Boolean)
            if (filteredAssets.length > 0) {
              console.log(`Deleting old assets for variant ${oldVariant.name}:`, filteredAssets)
              await supabase.storage.from(BUCKET_NAME).remove(filteredAssets)
            }
          }
        }
      }
    }

    console.log(`[UPDATE PRODUCT] About to save to DB. Updates object:`, JSON.stringify(updates, null, 2))

    await products.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    )
    const updated = await products.findOne({ _id: new ObjectId(req.params.id) })

    console.log(`[UPDATE PRODUCT] After save, product variants in DB:`, updated?.variants)

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

    // First, get the product to know its name (for folder deletion)
    const product = await products.findOne({ _id: new ObjectId(req.params.id) })

    // Delete from database
    await products.deleteOne({ _id: new ObjectId(req.params.id) })

    // Delete product folders (images and 3dmodels)
    if (product && product.name) {
      await deleteProductFolders(product.name)
    }

    return res.json({ success: true })
  } catch (e) {
    console.error('Delete product error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Configure Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// Only initialize if we have the keys
let supabase = null
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase Configured for URL:', supabaseUrl)
  } catch (err) {
    console.error('❌ Supabase Init Error:', err)
  }
} else {
  console.warn('⚠️ Supabase credentials missing! Uploads will not work.')
}
const BUCKET_NAME = 'ARfurniture_bucket'


// Helper to sanitize folder names
const sanitizeFolderName = (name) => {
  if (!name) return 'uncategorized'
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
    .substring(0, 50)             // Limit length
    || 'uncategorized'
}

// Helper to sanitize file names (preserve extension)
const sanitizeFileName = (originalName) => {
  if (!originalName) return 'unnamed-file'
  const ext = path.extname(originalName)
  const name = path.parse(originalName).name

  const sanitizedName = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)

  return `${sanitizedName}${ext}`
}

// Memory storage for uploads
const memoryStorage = multer.memoryStorage()

const uploadModelToSupabase = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
})

const uploadImageToSupabase = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// Helper to extract path from Supabase Public URL
const getPathFromUrl = (url) => {
  if (!url) return null
  try {
    // Example: https://project.supabase.co/storage/v1/object/public/ARfurniture_bucket/path/to/file.ext
    // We need 'path/to/file.ext'
    const bucketToken = `${BUCKET_NAME}/`
    if (url.includes(bucketToken)) {
      return url.split(bucketToken)[1]
    }
    return null
  } catch (e) {
    console.error('Error extracting path from URL:', e)
    return null
  }
}

// Helper to delete Supabase folder content (recursive)
const deleteSupabaseFolder = async (folderPath) => {
  if (!supabase) return
  console.log(`[STORAGE] 🗑️ Initiating recursive purge for path: ${folderPath}`)
  try {
    // List files and folders at this path
    const { data: list, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      // If folder doesn't exist, that's fine - nothing to delete
      if (listError.message?.includes('not found') || listError.statusCode === '404') {
        console.log(`[STORAGE] ℹ️ Folder does not exist: ${folderPath}`)
        return
      }
      throw listError
    }

    if (list && list.length > 0) {
      // Separate files and folders
      const files = []
      const folders = []

      for (const item of list) {
        if (item.id) {
          // It's a file
          files.push(`${folderPath}/${item.name}`)
        } else {
          // It's a folder - recursively delete it first
          folders.push(item.name)
        }
      }

      // Recursively delete subfolders first
      for (const folder of folders) {
        await deleteSupabaseFolder(`${folderPath}/${folder}`)
      }

      // Delete files in current folder
      if (files.length > 0) {
        console.log(`[STORAGE] 🔥 Deleting ${files.length} files from ${folderPath}...`)
        const { error: removeError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(files)

        if (removeError) {
          console.error(`[STORAGE] ❌ Failed to remove files:`, removeError)
          throw removeError
        }
      }

      console.log(`[STORAGE] ✅ Successfully purged folder: ${folderPath}`)
    } else {
      console.log(`[STORAGE] ℹ️ Folder is already empty: ${folderPath}`)
    }
  } catch (e) {
    console.error(`[STORAGE] ❌ Critical error during purge of ${folderPath}:`, e)
  }
}

// Helper to delete all product assets (Supabase version)
const deleteProductFolders = async (productName) => {
  if (!productName) return
  const folderName = sanitizeFolderName(productName)
  await deleteSupabaseFolder(folderName)
}

// =====================
// FILE UPLOAD API
// =====================

// Upload image endpoint (Supabase)
app.post('/api/upload/image', uploadImageToSupabase.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    const productFolder = sanitizeFolderName(req.body.productName || req.query.productName)
    const variantName = req.body.variantName || req.query.variantName
    const fileName = `${Date.now()}-${sanitizeFileName(req.file.originalname)}`

    // New Structure: {product-name}/{variant-name}/images/{filename}
    // Default variant name to 'main' if not provided
    const vName = sanitizeFolderName(variantName || 'main')
    const typeFolder = 'images'
    const folderPath = `${productFolder}/${vName}/${typeFolder}`
    const filePath = `${folderPath}/${fileName}`

    console.log(`[UPLOAD IMAGE] Uploading to: ${filePath}`)

    // CRITICAL: Delete ALL existing files in this variant's images folder first
    console.log(`[UPLOAD IMAGE] Deleting all existing files in: ${folderPath}`)
    await deleteSupabaseFolder(folderPath)

    console.log(`[UPLOAD IMAGE] Now uploading new image: ${filePath}`)

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      })

    if (error) throw error

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    const url = publicUrlData.publicUrl
    console.log('✓ Image uploaded (Supabase):', url)
    return res.json({ url })

  } catch (e) {
    console.error('Image upload error:', e)
    return res.status(500).json({ error: 'Upload failed: ' + e.message })
  }
})

// Upload additional image endpoint (Supabase)
app.post('/api/upload/additional-image', uploadImageToSupabase.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    const productFolder = sanitizeFolderName(req.body.productName || req.query.productName)
    const fileName = `${Date.now()}-${sanitizeFileName(req.file.originalname)}`

    // New Structure: {product-name}/additional-images/{filename}
    const filePath = `${productFolder}/additional-images/${fileName}`

    console.log(`Uploading gallery image to Supabase: ${filePath}`)

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      })

    if (error) throw error

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    const url = publicUrlData.publicUrl
    console.log('✓ Additional image uploaded (Supabase):', url)
    return res.json({ url })

  } catch (e) {
    console.error('Additional image upload error:', e)
    return res.status(500).json({ error: 'Upload failed: ' + e.message })
  }
})

// Delete additional image endpoint (Supabase)
app.delete('/api/upload/additional-image', async (req, res) => {
  try {
    const imageUrl = req.query.url
    if (!imageUrl) {
      return res.status(400).json({ error: 'No URL provided' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    const filePath = getPathFromUrl(imageUrl)
    if (filePath) {
      console.log('Deleting file from Supabase:', filePath)
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])

      if (error) throw error
      console.log('✓ Deleted additional image')
    } else {
      console.log('⚠ Could not extract path from URL, skipping delete:', imageUrl)
    }

    return res.json({ success: true })
  } catch (e) {
    console.error('Delete additional image error:', e)
    return res.status(500).json({ error: 'Delete failed' })
  }
})

// Upload GLB model endpoint (Supabase)
app.post('/api/upload/model', uploadModelToSupabase.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    const productFolder = sanitizeFolderName(req.body.productName || req.query.productName)
    const variantName = req.body.variantName || req.query.variantName
    const fileName = `${Date.now()}-${sanitizeFileName(req.file.originalname)}`

    // New Structure: {product-name}/{variant-name}/model/{filename}
    // Default variant name to 'main' if not provided
    const vName = sanitizeFolderName(variantName || 'main')
    const typeFolder = 'model'
    const folderPath = `${productFolder}/${vName}/${typeFolder}`
    const filePath = `${folderPath}/${fileName}`

    console.log(`[UPLOAD MODEL] Uploading to: ${filePath}`)

    // CRITICAL: Delete ALL existing files in this variant's model folder first
    console.log(`[UPLOAD MODEL] Deleting all existing files in: ${folderPath}`)
    await deleteSupabaseFolder(folderPath)

    console.log(`[UPLOAD MODEL] Now uploading new model: ${filePath}`)

    // Upload to Supabase Bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, req.file.buffer, {
        contentType: 'model/gltf-binary',
        upsert: true
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw error
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    const url = publicUrlData.publicUrl
    console.log('✓ Model uploaded (Supabase):', url)
    return res.json({ url })

  } catch (e) {
    console.error('Model upload error details:', e)
    return res.status(500).json({ error: 'Upload failed: ' + e.message })
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

// =====================
// DASHBOARD STATS API
// =====================

app.get('/api/admin/dashboard-stats', async (req, res) => {
  try {
    const totalProducts = await products.countDocuments({})
    const pendingOrders = await orders.countDocuments({ status: 'pending' })
    const activeCustomers = await users.countDocuments({}) // Count all users for now

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

    return res.json({
      totalProducts,
      pendingOrders,
      activeCustomers,
      monthlyRevenue
    })
  } catch (e) {
    console.error('Get dashboard stats error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})
