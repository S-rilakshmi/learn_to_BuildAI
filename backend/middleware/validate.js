import { httpError } from '../utils.js'

// Express middleware that runs between multer and the controller, so the
// controller can assume it was handed a PDF. Anything it rejects goes to
// middleware/error.js via next(err), which reads the status off the error.

// Multer has already parsed the body, so req.file and req.body are both
// populated by the time this runs.
export function validateResumeUpload(req, _res, next) {
    if (!req.file) {
        return next(httpError(400, 'No resume uploaded. Send a PDF as the "resume" field.'))
    }

    // The client's extension check is a convenience only - nothing stops a
    // crafted request, so the server checks the declared type too.
    if (req.file.mimetype !== 'application/pdf') {
        return next(httpError(415, 'That file is not a PDF. Upload a .pdf resume.'))
    }

    next()
}

// Given `fields` (an array of { value, message } describing what the request
// is missing), throw a 400 listing them. Useful once a request can be wrong in
// several ways at once - a valid PDF but a one-word JD, say.
export function requireFields(fields) {
    const problems = fields.filter(({ value }) => !value).map(({ message }) => message)
    if (problems.length > 0) {
        throw httpError(400, problems.join(' '))
    }
}