// The one place that knows the backend's address and shape.
// Components import from here instead of calling fetch() directly, so moving
// the API or changing the response naming only touches this file.

// In dev, Vite proxies /api to the Express server (see vite.config.js), so a
// relative URL works and there is no CORS preflight to worry about.
//
// In production with two separate Vercel projects the frontend and backend are
// different origins, so VITE_API_URL must be set in the FRONTEND project's
// environment variables to the backend's URL (e.g. https://your-backend.vercel.app).
// Without it, `${''}/api/analyze` would call the frontend's own domain, hit the
// SPA rewrite in frontend/vercel.json, and come back as index.html instead of JSON.
const BASE_URL =
    import.meta.env.VITE_API_URL || ''

export async function analyzeResume(file, jobDescription) {
    const body = new FormData()
    body.append('resume', file)
    body.append('jobDescription', jobDescription)

    const res = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        body, // no Content-Type header: the browser sets the multipart boundary itself
    })

    // A cross-origin failure or a proxy error can return HTML rather than JSON,
    // so the parse is allowed to fail and the status is used for the message.
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
        throw new Error(data.error || `The server answered ${res.status}.`)
    }
    return data
}