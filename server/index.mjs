import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Configuration
import { connectDatabase, getCollections, isConnected } from './config/database.mjs'
import { initializeSupabase, getSupabaseClient } from './config/storage.mjs'

// Middleware
import { requestIdMiddleware, requestLogger } from './middleware/requestLogger.mjs'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.mjs'

// Routes
import authRoutes from './routes/auth.mjs'
import productRoutes from './routes/products.mjs'
import uploadRoutes from './routes/uploads.mjs'
import orderRoutes from './routes/orders.mjs'
import bannerRoutes from './routes/banners.mjs'
import adminRoutes from './routes/admin.mjs'
import cartRoutes from './routes/cart.mjs'
import addressRoutes from './routes/address.mjs'
import settingsRoutes from './routes/settings.mjs'
import notificationRoutes from './routes/notifications.mjs'

// Utilities
import logger from './utils/logger.mjs'

// =====================
// INITIALIZATION
// =====================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables only in local development
if (!process.env.VERCEL) {
  dotenv.config()
  if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
  }
}

const app = express()

// Simple ping route to verify the server is alive
app.get('/api/ping', (req, res) => res.send('pong'))

// =====================
// MIDDLEWARE SETUP
// =====================

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

// Body parsing
app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ extended: true, limit: '200mb' }))

// Request ID and logging
app.use(requestIdMiddleware)
app.use(requestLogger)

// Serve static files from products folder
const productsPath = path.join(__dirname, '..', 'products')
app.use('/products', express.static(productsPath))

// =====================
// DATABASE & STORAGE SETUP
// =====================

// Validate required environment variables
const MONGODB_URI = process.env.MONGODB_URI
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!MONGODB_URI) {
  logger.error('MONGODB_URI environment variable is required')
  process.exit(1)
}

// Connect to database and initialize storage
logger.info('Initializing server...')

let dbInitPromise = null;
const ensureDb = async () => {
  if (isConnected() && app.locals.collections) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        const database = await connectDatabase(MONGODB_URI);
        app.locals.collections = getCollections();
        return database;
      } catch (err) {
        dbInitPromise = null;
        throw err;
      }
    })();
  }
  return dbInitPromise;
};

// Database initialization will happen on-demand via dbGuard middleware
// to prevent cold-start timeouts on serverless environments.
dbInitPromise = null;

// Middleware to ensure DB is connected for API routes
const dbGuard = async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection failed',
      details: err.message
    });
  }
};

// Initialize Supabase
let supabase = null;
try {
  supabase = initializeSupabase(SUPABASE_URL, SUPABASE_KEY)
} catch (err) {
  logger.error('Failed to initialize Supabase', err);
}

// =====================
// HEALTH CHECK
// =====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: isConnected() ? 'connected' : 'connecting/failed',
    storage: getSupabaseClient() ? 'configured' : 'not configured',
    nodeVersion: process.version,
    hasFetch: typeof fetch === 'function',
    hasBrevoKey: !!process.env.BREVO_API_KEY,
    brevoEmail: process.env.BREVO_FROM_EMAIL
  })
})

app.get('/', (req, res) => {
  res.json({
    message: 'ARfurniture API Server',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      banners: '/api/banners',
      uploads: '/api/upload',
      admin: '/api/admin',
      cart: '/api/cart',
      health: '/health'
    }
  })
})

// =====================
// API ROUTES
// =====================

app.use('/api/auth', dbGuard, authRoutes)
app.use('/api/products', dbGuard, productRoutes)
app.use('/api/upload', dbGuard, uploadRoutes)
app.use('/api/orders', dbGuard, orderRoutes)
app.use('/api/banners', dbGuard, bannerRoutes)
app.use('/api/admin', dbGuard, adminRoutes)
app.use('/api/cart', dbGuard, cartRoutes)
app.use('/api/address', dbGuard, addressRoutes)
app.use('/api/settings', dbGuard, settingsRoutes)
app.use('/api/notifications', dbGuard, notificationRoutes)

// =====================
// ERROR HANDLING
// =====================

// 404 handler
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)

// =====================
// START SERVER
// =====================

const port = process.env.PORT || 4000

if (!process.env.VERCEL) {
  app.listen(port, () => {
    logger.success(`Server listening on http://localhost:${port}`)
    logger.info('Available routes:')
    logger.info('  - POST   /api/auth/signup')
    logger.info('  - POST   /api/auth/login')
    logger.info('  - POST   /api/auth/admins/login')
    logger.info('  - POST   /api/auth/forgot-password')
    logger.info('  - GET    /api/products')
    logger.info('  - POST   /api/products')
    logger.info('  - GET    /api/products/:id')
    logger.info('  - PUT    /api/products/:id')
    logger.info('  - DELETE /api/products/:id')
    logger.info('  - POST   /api/upload/image')
    logger.info('  - POST   /api/upload/model')
    logger.info('  - GET    /api/orders')
    logger.info('  - POST   /api/orders')
    logger.info('  - PATCH  /api/orders/:id/status')
    logger.info('  - GET    /api/banners')
    logger.info('  - POST   /api/banners')
    logger.info('  - PUT    /api/banners/:id')
    logger.info('  - DELETE /api/banners/:id')
    logger.info('  - GET    /api/admin/dashboard-stats')
    logger.info('  - GET    /api/cart/:userId')
    logger.info('  - POST   /api/cart/:userId/items')
    logger.info('  - PUT    /api/cart/:userId/items/:productId')
    logger.info('  - DELETE /api/cart/:userId/items/:productId')
    logger.info('  - DELETE /api/cart/:userId')
    logger.info('  - GET    /api/address/:userId')
    logger.info('  - POST   /api/address/:userId')
    logger.info('  - PUT    /api/address/:userId/:addressId')
    logger.info('  - DELETE /api/address/:userId/:addressId')
    logger.info('  - GET    /health')
  })
}

export default app;
