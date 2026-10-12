// The one place that knows the backend's address and shape.
// Components import from here instead of calling fetch() directly, so moving
// the API or changing the response naming only touches this file.

// In dev, Vite proxies /api to the Express server (see vite.config.js), so a
// relative URL works and there is no CORS preflight to worry about.
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

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
        throw new Error(data.error || `The server answered ${res.status}.`)
    }
    return data
}