import express from 'express'
import cors from 'cors'

import { CLIENT_ORIGIN } from './config/env.js'
import { connectDb } from './config/db.js'
import analyzeRoutes from './routes/analyze.js'
import { notFound, errorHandler } from './middleware/error.js'

// The Express app, built and exported but NOT listening. Keeping this separate
// from server.js is what lets the same app run in two places:
//
//   - locally, where server.js calls app.listen()
//   - on Vercel, where the platform imports this file and drives it per request
//
// If the app only existed inside server.js, Vercel would have nothing to
// import and would have to start a whole process per request.

const app = express()

// CLIENT_ORIGIN is a list of allowed origins (see config/env.js). In the
// services setup the frontend is served from this same domain, so nothing
// cross-origin needs listing in production; it matters only for local work
// from the Vite dev server.
app.use(cors({ origin: CLIENT_ORIGIN }))
app.use(express.json())

// The one piece of middleware that exists for Vercel's sake. Lambda's Mongo
// connection is not established when the process starts - the platform just
// imports this module - so the first request that arrives has to open it, and
// connectDb() is written to reuse the connection on later requests.
//
// Guarded to /api so the frontend's own requests, and anything static, do not
// each trigger a connection attempt.
app.use('/api', async(_req, _res, next) => {
    try {
        await connectDb()
        next()
    } catch (err) {
        next(err)
    }
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api', analyzeRoutes)

// Order matters here too: a 404 catch-all first for anything that matched no
// route, then the error handler for anything that threw on the way.
app.use(notFound)
app.use(errorHandler)

export default app