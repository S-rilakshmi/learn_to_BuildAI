import mongoose from 'mongoose'

// A resume, a job description, and the analysis that came out of comparing
// them. Kept as one document because they only ever make sense together.
const analysisSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    resumeText: { type: String, required: true },
    jobDescription: { type: String, required: true },
    score: { type: Number, required: true },
    present: { type: [String], default: [] },
    missing: { type: [String], default: [] },
    matchedKeywords: { type: [String], default: [] },
}, { timestamps: true }, )

export const Analysis = mongoose.model('Analysis', analysisSchema)