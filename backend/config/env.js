import 'dotenv/config'

import { clampInt } from '../utils.js'

// Every environment value the server reads, resolved in one place. The rest of
// the app imports from here instead of touching process.env, so a mistyped
// variable name is one edit rather than a hunt through the codebase.
//
// The key is MONGODB_URI (not MONGO_URI) - it must match backend/.env exactly,
// or it arrives as undefined and the server refuses to boot.
//
// Note: no numeric separators (12_000) in this file. Something in the save path
// has been inserting a space into them, producing `12 _000`, which is a syntax
// error. Plain digits are used instead.

export const PORT = process.env.PORT || 4000
export const MONGO_URI = process.env.MONGODB_URI

// In the services setup the frontend and the backend share one Vercel domain,
// so browser requests are same-origin and CORS never gets involved - meaning
// the correct default is "no cross-origin allowed", not the Vite dev server.
// Locally, where Vite (:5173) proxies to Express (:4000), the Origin header is
// http://localhost:5173 and the proxy forwards it, so CORS_ORIGINS carries it.
// Comma-separate several origins if you need to.
export const CLIENT_ORIGIN = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

// 5 MB is plenty for a resume.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

// ---- labd -----------------------------------------------------------------
// The AI half of the app calls labd from here, on the server. The key is read
// from the environment and never leaves this process: labd will not answer a
// browser on another origin, so a key shipped in the frontend bundle is a key
// anyone can read out of the page source.

export const LABD_API_KEY = process.env.LABD_API_KEY
export const LABD_API_URL = process.env.LABD_API_URL || 'https://agent.thedevlabs.io/v1/api/chat'

// How long to wait on labd before giving up. A serverless function is killed at
// roughly 10s by default on Vercel's free tier, so a request that hangs has to
// be cut short here, where we can still answer with something useful.
export const LABD_TIMEOUT_MS = clampInt(process.env.LABD_TIMEOUT_MS, 12000, 1000, 60000)

// How many analyses may be started per IP per window. Each call spends part of
// the shared monthly labd allowance, so an unmetered endpoint is one anyone can
// drain. See middleware/rateLimit.js.
export const ANALYZE_RATE_LIMIT = clampInt(process.env.ANALYZE_RATE_LIMIT, 10, 1, 1000)
export const ANALYZE_RATE_WINDOW_MS = clampInt(process.env.ANALYZE_RATE_WINDOW_MS, 600000, 1000, 86400000)