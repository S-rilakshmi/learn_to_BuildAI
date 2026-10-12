// Small helpers shared across the backend: nothing Express-shaped and nothing
// specific to resumes belongs here.

// An Error that carries an HTTP status, so a service can say "this is a 422"
// without importing Express. middleware/error.js reads .status and turns it
// into the response. This is the seam that keeps HTTP out of the services.
export function httpError(status, message) {
    const err = new Error(message)
    err.status = status
    return err
}

// Collapse a blob of text into lowercase words separated by single spaces.
// Punctuation is stripped, except the characters that appear in real tech
// names - C++, C#, Node.js - which must survive so "c++" can be matched.
export function normalise(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[^a-z0-9+#.\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

// Assumes text has already been through normalise().
export function words(normalisedText) {
    return normalisedText.split(' ').filter(Boolean)
}

// "C++" and "Node.js" are regex metacharacters; escape them before building a
// pattern out of a skill name.
export function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Human-readable size for error messages, e.g. 5242880 -> "5 MB".
export function formatBytes(bytes) {
    return `${Math.round(bytes / 1024 / 1024)} MB`
}