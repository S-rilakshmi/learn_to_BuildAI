import { ANALYZE_RATE_LIMIT, ANALYZE_RATE_WINDOW_MS } from '../config/env.js'
import { httpError } from '../utils.js'

// ============================================================
// A fixed-window rate limit for /api/analyze.
//
// Every analysis spends part of the account's monthly labd allowance, so an
// endpoint with no limit is one anyone can drain - the PDF size limit caps each
// request, not how many arrive. This is the cheapest thing that makes that cost
// bounded.
//
// The window is "fixed" (reset wholesale at the end of each period) rather than
// "sliding" (each request tracked individually): a Map of counters is a few
// lines, and for a resume parser the difference is not worth a dependency.
//
// The store lives in module scope, so on Vercel it is per-instance and dies with
// the function. That is a real limitation, not an oversight - at scale you would
// move the counter to Mongo or Redis so every instance shares it. Note it also
// keys on IP, which behind a proxy is only as good as the platform's
// `x-forwarded-for` header.
// ============================================================

const hits = new Map()
let windowStartedAt = Date.now()

export function rateLimitAnalyze(req, _res, next) {
    const now = Date.now()

    // One window for everyone rather than per IP, so the map stays small.
    if (now - windowStartedAt >= ANALYZE_RATE_WINDOW_MS) {
        hits.clear()
        windowStartedAt = now
    }

    // Trust the platform's forwarded header first (Vercel sets it), fall back to
    // the socket address for local work.
    const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim()
    const used = (hits.get(ip) || 0) + 1
    hits.set(ip, used)

    if (used > ANALYZE_RATE_LIMIT) {
        const retryAfterSec = Math.ceil((windowStartedAt + ANALYZE_RATE_WINDOW_MS - now) / 1000)
        return next(httpError(
            429,
            `That is ${ANALYZE_RATE_LIMIT} analyses in a short window. Try again in about ${Math.max(1, retryAfterSec)}s.`,
        ))
    }

    next()
}