import { LABD_API_KEY, LABD_API_URL, LABD_TIMEOUT_MS } from '../config/env.js'
import { httpError } from '../utils.js'
import { parseReview, statusFor, messageFor, readContent, readPercentLeft } from '../lib/labdResponse.js'

// ============================================================
// The one place in the backend that talks to labd.
//
// It is a plain HTTP call, so it stays a service (see service/analyzeService.js)
// rather than living in a controller: no req, no res, just text in and a plain
// object out. That also makes it callable from a test or a script.
//
// Two rules shape everything below:
//
//  1. The key stays here. It is read from the environment on the server and is
//     never sent to the browser - labd will not answer a page on another origin,
//     so a key in the frontend bundle is a key anyone viewing the page can copy.
//  2. Nothing is remembered between requests. Each call is a fresh conversation,
//     so the resume and the JD are sent in full every time.
//
// Parsing the reply and mapping labd's statuses lives in lib/labdResponse.js,
// which is pure code and therefore testable without a network or a server.
//
// Note: no optional chaining (`?.`) in this file. A save hook in this project has
// been inserting a space into `?.`, producing the syntax error `? .`, so plain
// truthiness checks are used throughout.
// ============================================================

// How the answer must come back. Asking for a strict shape is cheaper and more
// reliable than asking for prose and then guessing at it with regexes.
const SYSTEM_PROMPT = `You are a resume screening assistant inside a web app.

You are given a candidate's resume text and a job description. Compare them.

Answer with JSON only - no prose before or after, no markdown fence. Use exactly
this shape:

{
  "score": 0-100,
  "verdict": "one short sentence, at most 140 characters",
  "present": ["skills the job asks for that the resume demonstrably shows"],
  "missing": ["skills the job asks for that the resume does not show"]
}

Rules:
- Judge only what the resume text states or clearly implies. Never invent a skill
  that is not in the resume.
- "present" and "missing" must both be arrays of short strings - a skill name,
  not a sentence. At most 15 each.
- score reflects how well the resume matches this job description, not how good
  the candidate is in general.`

// labd is stateless, so the whole context goes into one message on every call.
// The system prompt rides in the same messages array as a leading turn, because
// the API description only names roles user and assistant.
function buildMessages({ resumeText, jobDescription }) {
    return [
        { role: 'user', content: SYSTEM_PROMPT },
        { role: 'assistant', content: 'Understood. Send the job description and resume.' },
        {
            role: 'user',
            content: `JOB DESCRIPTION\n"""\n${jobDescription}\n"""\n\nRESUME\n"""\n${resumeText}\n"""`,
        },
    ]
}

// Ask labd to read a resume against a job description.
//
// Returns { score, verdict, present, missing, percentLeft } where percentLeft is
// what is left of the labd allowance, straight from the API's `credits`.
// Throws an httpError with a status the caller can act on.
export async function reviewResume({ resumeText, jobDescription }) {
    const data = await callLabd({ messages: buildMessages({ resumeText, jobDescription }) })

    // The API answers once, in JSON: message.content is the reply and
    // credits.percentLeft is what is left of the allowance.
    const raw = readContent(data)
    if (!raw.trim()) {
        throw httpError(502, 'labd answered without any content. Try again in a moment.')
    }

    const parsed = parseReview(raw)
    if (!parsed) {
        throw httpError(502, 'labd\u2019s answer was not in the shape the app expects. Try again.')
    }

    return {...parsed, percentLeft: readPercentLeft(data) }
}

// The HTTP call itself, kept separate so reviewResume() is only about meaning.
async function callLabd(body) {
    if (!LABD_API_KEY) {
        // A configuration problem, not the learner's mistake - so it is a 503
        // with a message aimed at whoever runs the server.
        throw httpError(503, 'labd is not configured on this server: LABD_API_KEY is missing.')
    }

    // AbortSignal.timeout() cuts the request off rather than letting it hang
    // until the serverless platform kills the whole invocation.
    let res
    try {
        res = await fetch(LABD_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${LABD_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(LABD_TIMEOUT_MS),
        })
    } catch (err) {
        const name = err && err.name
        const timedOut = name === 'TimeoutError' || name === 'AbortError'
        throw httpError(
            timedOut ? 504 : 502,
            timedOut ?
            'labd took too long to answer. Try again, or with a shorter job description.' :
            'Could not reach labd. Check the server\u2019s network and try again.',
        )
    }

    // Read the body once, whatever the status. A 4xx from labd still carries an
    // explanation worth passing on, and a 429 needs its meaning preserved.
    const data = await res.json().catch(() => null)

    if (!res.ok) {
        throw httpError(statusFor(res.status), messageFor(res.status, data))
    }

    return data
}

export { SYSTEM_PROMPT, buildMessages }