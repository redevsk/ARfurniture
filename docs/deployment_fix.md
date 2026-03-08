# Production Deployment Documentation: ARFurniture

This document outlines the steps taken to transition the ARFurniture (Beauteous Palochina) project from a local development environment to a production-ready deployment on Vercel.

## 1. Architecture Overview
The application consists of a **React/Vite frontend** and a **Node.js/Express backend**. To simplify management and avoid CORS issues, we adopted a **monolithic deployment** strategy. Both tiles are served from the same domain, with `/api/*` requests routed to the backend serverless function.

## 2. Backend Enhancements for Vercel

### 2.1 Serverless Conversion
Vercel handles server processes differently than a traditional VM. We modified `server/index.mjs` to:
- Export the `app` instance as its default export.
- Wrap the `app.listen()` call in a check: `if (!process.env.VERCEL) { ... }`.
- Created a entry point at `api/index.js` that simply imports and exports the Express app.

### 2.2 Database Connection Guard
On Vercel (Serverless), the database connection might not be ready when the first request arrives. We implemented a robust connection management system:
- **`dbGuard` Middleware**: Added to every API route to ensure the database is connected before processing.
- **`ensureDb` Utility**: A singleton promise that prevents race conditions during database initialization.

### 2.3 Module Compatibility
- **ESM Migration**: Converted CommonJS-style `require` (used for `uuid`) to standard ESM `import` in `server/routes/address.mjs` to prevent runtime crashes on the Vercel platform.

## 3. Frontend Production Adjustments

### 3.1 Dynamic API Resolution
We refactored `constants.ts` to use a smarter `getApiBaseUrl` function:
- **Automatic Detection**: It checks `window.location.hostname`. If not on `localhost`, it returns an empty string, allowing the browser to treat API calls as same-origin (relative paths).
- **Vite Static Replacement**: Used `import.meta.env.PROD` for static replacement during the build process.

### 3.2 Build Configuration
Updated `vite.config.ts` to:
- Prevent hard-coding development URLs during the production build.
- Ensure environment variables are dynamically resolved or defaulted correctly.

## 4. Deployment Configuration

### 4.1 Vercel Settings (`vercel.json`)
Created a `vercel.json` file with:
- **Rewrites**: Redirects all `/api/(.*)` to the backend entry point.
- **Functions**: Explicitly included the `server` directory in the serverless function build to ensure all code is bundled.

### 4.2 Environment Variables
The following variables were configured in the Vercel dashboard/CLI:
- `MONGODB_URI`: Production database connection string.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: For asset storage.
- `GEMINI_API_KEY`: For AI features.
- `BREVO_API_KEY`: For email automation.

## 5. Summary of Key Files
| File | Purpose |
| :--- | :--- |
| `vercel.json` | Routing and deployment configuration. |
| `server/index.mjs` | Backend entry point with Vercel-compatible exports. |
| `constants.ts` | Centralized API URL management. |
| `api/index.js` | Serverless function bridge. |

## 6. Verified Features (Production)
- ✅ **Database**: MongoDB Atlas connected and serving products.
- ✅ **Storage**: Supabase serving 3D models and images.
- ✅ **Email**: Brevo API verified working for Password Resets and Order Invoices.
- ✅ **Real-time**: Notification system initialized and ready.

## 7. How to Redeploy
To push new changes to production, run:
```powershell
npx vercel build --prod --yes
npx vercel deploy --prebuilt --prod --yes
```

---
**Status**: Active & Verified
**URL**: [https://arfurniture-lime.vercel.app/](https://arfurniture-lime.vercel.app/)
