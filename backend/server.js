import app from './app.js'
import { PORT } from './config/env.js'
import { connectDb } from './config/db.js'

// Local entry point. On Vercel this file is never used - the platform imports
// app.js directly - but here it is what you run with `npm run dev`.
//
// Connect first, then listen: if Mongo is down you get a clear crash at boot
// instead of a server that accepts uploads it can never save.
connectDb()
    .then(() => {
        app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`))
    })
    .catch((err) => {
        console.error('[server] could not start:', err.message)
        process.exit(1)
    })