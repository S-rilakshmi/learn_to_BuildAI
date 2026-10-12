import { httpError } from '../utils.js'
import { extractPdfText } from './pdfService.js'
import { reviewResume } from './labdService.js'
import { findKeywords, scoreKeywords } from '../lib/keywordMatcher.js'
import { Analysis } from '../models/Analysis.js'

// The application logic for "compare a resume against a job description".
// No req, no res, no Express: it takes plain values, returns a plain object,
// and signals expected failures by throwing httpError(...) with a status.
// That is what lets this be called from a test, a CLI, or a queue later.
//
// The scoring has two engines, and the difference is worth keeping in mind:
//
//   - keywordMatcher (lib/keywordMatcher.js) is deterministic. It pulls skills
//     out of the JD and looks for them in the resume text. No network, no cost.
//   - labd (service/labdService.js) reads both documents and judges the fit.
//
// labd is primary. It is a paid, rate-limited call that can fail on its own -
// slow, out of allowance, no key configured - so a failure falls back to the
// keyword engine rather than turning into an error the learner cannot act on.
// `engine` on the response says which one produced the numbers on screen.

export async function analyzeResume({ file, jobDescription }) {
    if (!file) {
        throw httpError(400, 'No resume uploaded. Send a PDF as the "resume" field.')
    }

    const jd = (jobDescription || '').trim()
    if (jd.length < 20) {
        throw httpError(400, 'Paste the job description (at least 20 characters) so there is something to compare against.')
    }

    const resumeText = await extractPdfText(file.buffer)
    if (!resumeText) {
        throw httpError(422, 'No text could be read out of that PDF. If it is a scan or photo, export it as text-based PDF first.')
    }

    const result = await scoreWithLabdOrFallback({ resumeText, jobDescription: jd })

    const doc = await Analysis.create({
        fileName: file.originalname,
        resumeText,
        jobDescription: jd,
        engine: result.engine,
        score: result.score,
        verdict: result.verdict,
        present: result.present,
        missing: result.missing,
        // Only meaningful when labd answered; null on the keyword fallback.
        percentLeft: result.percentLeft,
        matchedKeywords: result.matchedKeywords,
    })

    return {
        id: doc.id,
        fileName: doc.fileName,
        engine: doc.engine,
        score: doc.score,
        verdict: doc.verdict,
        present: doc.present,
        missing: doc.missing,
        percentLeft: doc.percentLeft,
        createdAt: doc.createdAt,
    }
}

// Try labd; if it cannot answer, use the keyword matcher instead.
//
// Only failures labd itself caused are swallowed (5xx and 429 - see
// statusFor() in labdService.js). A 4xx reaching here would mean the request we
// built was wrong, which is a bug in this file, and that should stay loud.
async function scoreWithLabdOrFallback({ resumeText, jobDescription }) {
    try {
        const review = await reviewResume({ resumeText, jobDescription })
        return {
            engine: 'labd',
            score: review.score,
            verdict: review.verdict,
            present: review.present,
            missing: review.missing,
            percentLeft: review.percentLeft,
            matchedKeywords: [],
        }
    } catch (err) {
        if (!isFallbackWorthy(err)) throw err
        console.warn(`[analyze] labd unavailable (${err.status}): ${err.message} - scoring with keywords instead`)
        return {...scoreWithKeywords(resumeText, jobDescription), percentLeft: null }
    }
}

function isFallbackWorthy(err) {
    return err ? .status === 429 || (err ? .status >= 500 && err.status < 600)
}

function scoreWithKeywords(resumeText, jobDescription) {
    const keywords = findKeywords(jobDescription)
    if (keywords.length === 0) {
        throw httpError(422, 'No comparable keywords were found in the job description.')
    }

    const { score, present, missing, matchedKeywords } = scoreKeywords(resumeText, keywords)
    return {
        engine: 'keywords',
        score,
        verdict: '',
        present,
        missing,
        matchedKeywords,
    }
}

// The most recent analyses, newest first - handy for checking the Mongo
// connection actually works without opening a DB client.
export async function listAnalyses(limit = 20) {
    return Analysis.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('fileName engine score present missing createdAt')
}