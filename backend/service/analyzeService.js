import { httpError } from '../utils.js'
import { extractPdfText } from './pdfService.js'
import { findKeywords, scoreKeywords } from '../lib/keywordMatcher.js'
import { Analysis } from '../models/Analysis.js'

// The application logic for "compare a resume against a job description".
// No req, no res, no Express: it takes plain values, returns a plain object,
// and signals expected failures by throwing httpError(...) with a status.
// That is what lets this be called from a test, a CLI, or a queue later.

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

    const keywords = findKeywords(jd)
    if (keywords.length === 0) {
        throw httpError(422, 'No comparable keywords were found in the job description.')
    }

    const result = scoreKeywords(resumeText, keywords)

    const doc = await Analysis.create({
        fileName: file.originalname,
        resumeText,
        jobDescription: jd,
        ...result,
    })

    return {
        id: doc.id,
        fileName: doc.fileName,
        score: doc.score,
        present: doc.present,
        missing: doc.missing,
        createdAt: doc.createdAt,
    }
}

// The most recent analyses, newest first - handy for checking the Mongo
// connection actually works without opening a DB client.
export async function listAnalyses(limit = 20) {
    return Analysis.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('fileName score present missing createdAt')
}