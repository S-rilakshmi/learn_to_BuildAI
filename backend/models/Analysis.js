import mongoose from 'mongoose'

// A resume, a job description, and the analysis that came out of comparing
// them. Kept as one document because they only ever make sense together.
const analysisSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    resumeText: { type: String, required: true },
    jobDescription: { type: String, required: true },
    score: { type: Number, required: true },
    // Which engine produced this document: 'labd' or 'keywords'. Mongoose's
    // schema is strict by default, so a field that is not declared here is
    // dropped on save without a word - these three were added for that reason.
    engine: { type: String, enum: ['labd', 'keywords'], default: 'keywords' },
    verdict: { type: String, default: '' },
    // labd's remaining allowance at the time, as a percentage; null when the
    // keyword engine answered and labd was never called.
    percentLeft: { type: Number, default: null },
    present: { type: [String], default: [] },
    missing: { type: [String], default: [] },
    matchedKeywords: { type: [String], default: [] },
}, { timestamps: true }, )

export const Analysis = mongoose.model('Analysis', analysisSchema)