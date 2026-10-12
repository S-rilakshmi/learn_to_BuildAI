import mongoose from 'mongoose'

import { MONGO_URI } from './env.js'

// On Vercel every request may land on a fresh, short-lived invocation, so
// opening a new Mongo connection per request would exhaust the Atlas
// connection limit within minutes. Stashing the promise on a module-scoped
// variable reuses it for the life of the warm instance - and a promise is
// stashed rather than the connection itself so that two requests arriving
// together share one connect() instead of racing to open two.
//
// The globalThis cache keeps the promise alive across hot reloads in dev.
let cached = globalThis.__mongooseConnection
if (!cached) {
    cached = globalThis.__mongooseConnection = { promise: null }
}

export async function connectDb() {
    if (!MONGO_URI) {
        throw new Error('MONGODB_URI is missing - set it in Vercel project settings, or in backend/.env locally')
    }

    // Already connected on this instance: nothing to do.
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection
    }

    if (!cached.promise) {
        mongoose.connection.on('connected', () => console.log('[db] connected'))
        mongoose.connection.on('error', (err) => console.error('[db] error:', err.message))
        mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'))

        cached.promise = mongoose.connect(MONGO_URI)
    }

    await cached.promise
    return mongoose.connection
}