import { MAX_UPLOAD_BYTES } from '../config/env.js'
import { formatBytes } from '../utils.js'

// Registered after every route, so anything that fell through lands here.
export function notFound(req, res) {
    res.status(404).json({ error: `No route matches ${req.method} ${req.originalUrl}.` })
}

// Four arguments, so Express treats this as the error handler rather than
// ordinary middleware.
export function errorHandler(err, _req, res, _next) {
    // Multer's file-size limit arrives as an error, not a response.
    if (err ? .code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `That PDF is larger than ${formatBytes(MAX_UPLOAD_BYTES)}.` })
    }

    // A service signalling an expected failure - see httpError in utils.js.
    if (err ? .status) {
        return res.status(err.status).json({ error: err.message })
    }

    // Anything else is a bug: log it for us, tell the client nothing specific.
    console.error(err)
    res.status(500).json({ error: 'Something went wrong while analysing the resume.' })
}