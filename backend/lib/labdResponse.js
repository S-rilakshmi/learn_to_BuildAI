// ============================================================
// Turning labd's answer into data this app can trust.
//
// Everything in here is pure - strings and numbers in, strings and numbers out,
// no fetch, no config, no Express. That is deliberate: this is the part of the
// integration most likely to break (a model does not always return exactly the
// JSON it was asked for), so it is the part worth being able to test on its own.
// See test/labdResponse.test.js.
// ============================================================

// labd's own statuses, mapped to the status this app answers with.
//
// 401/402/403 are about the server's key and allowance - a learner cannot fix
// them, so they become 503 here rather than looking like their request was
// wrong. 429 means "too many requests this minute", and is the one status worth
// passing straight through. Anything else is an upstream failure: 502.
export function statusFor(status) {
    switch (status) {
        case 401:
        case 402:
        case 403:
            return 503
        case 429:
            return 429
        default:
            return 502
    }
}

export function messageFor(status, data) {
    switch (status) {
        case 401:
            return 'labd rejected the API key. Check LABD_API_KEY on the server.'
        case 402:
            return 'The labd allowance is used up for now. A top-up at learn.thedevlabs.io/settings#get-more-labd would restore it.'
        case 403:
            return 'The labd API is switched off for these labs at the moment.'
        case 429:
            return 'Too many labd requests this minute. Wait a moment and try again.'
        default:
            // Prefer labd's own words when it sent any.
            return typeof data ? .error === 'string' && data.error ?
                `labd could not handle that: ${data.error}` :
                `labd answered ${status}. Try again in a moment.`
    }
}

// Parse the JSON out of labd's reply.
//
// The model is asked for JSON only, and usually obliges - but an answer wrapped
// in a ```json fence, or with a sentence before the brace, is common enough that
// a bare JSON.parse(text) would throw away a perfectly good review. So try the
// whole string first, then the first {...} block inside it, and return null if
// neither is usable.
export function parseReview(raw) {
    const text = String(raw ? ? '').trim()
    if (!text) return null

    const candidates = [text]
    const braced = text.match(/\{[\s\S]*\}/)
    if (braced) candidates.push(braced[0])

    for (const candidate of candidates) {
        try {
            const review = sanitise(JSON.parse(candidate))
            if (review) return review
        } catch {
            // Not JSON - fall through to the next candidate.
        }
    }
    return null
}

// Never trust the shape of an answer that came from outside: coerce what should
// be a number into a number and what should be a list into a list of strings,
// and reject the answer outright if either is missing. A score with no skills on
// either side is not a review, whatever the model called it.
export function sanitise(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null

    const present = toStringList(value.present)
    const missing = toStringList(value.missing)
    if (present.length === 0 && missing.length === 0) return null

    const n = Number(value.score)
    if (!Number.isFinite(n)) return null

    return {
        score: Math.min(100, Math.max(0, Math.round(n))),
        verdict: typeof value.verdict === 'string' ? value.verdict.trim().slice(0, 200) : '',
        present,
        missing,
    }
}

// A score of 0 is valid, so this keeps 0 and only discards a value that is not a
// number at all. Used for credits.percentLeft.
export function numberOrNull(value) {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

function toStringList(value) {
    if (!Array.isArray(value)) return []
    return value
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 15)
}