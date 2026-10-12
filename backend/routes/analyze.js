import { Router } from 'express'

import { postAnalyze, getAnalyses } from '../controller/analyzeController.js'
import { uploadResume } from '../middleware/upload.js'
import { validateResumeUpload } from '../middleware/validate.js'

// Routes are wiring, not logic: a path, the middleware that guards it, and the
// controller that answers it. Nothing here knows how a resume is scored.
const router = Router()

router.post('/analyze', uploadResume, validateResumeUpload, postAnalyze)

// Small history view - useful for checking the Mongo connection actually works.
router.get('/analyses', getAnalyses)

export default router