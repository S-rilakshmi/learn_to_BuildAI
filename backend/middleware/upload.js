import multer from 'multer'

import { MAX_UPLOAD_BYTES } from '../config/env.js'

// Keep the PDF in memory: it is only ever handed to pdf-parse, so there is no
// reason to write a learner's resume to disk.
//
// `.single('resume')` is the middleware itself - the field name here has to
// match the FormData key the frontend appends in frontend/src/lib/api.js.
export const uploadResume = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES },
}).single('resume')