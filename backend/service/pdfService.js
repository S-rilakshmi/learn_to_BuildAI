import { createRequire } from 'node:module'

import { httpError } from '../utils.js'

// pdf-parse is a CommonJS package and is also known to look for a debug file
// at import time on some versions, so build the require from this module's URL
// instead of a bare `import`.
const require = createRequire(
    import.meta.url)
const pdfParse = require('pdf-parse')

// Turns a PDF buffer into clean plain text. Knows nothing about HTTP: it is
// handed a Buffer and returns a string (or '' if the PDF had no text layer).
export async function extractPdfText(buffer) {
    // pdf.js THROWS on a corrupt, encrypted or malformed PDF rather than
    // returning empty text, so this is the path most unreadable uploads take.
    // Catching it here is what turns the generic 500 into a message that says
    // what to do - the raw Error has no status, so without this it falls through
    // to the catch-all branch in middleware/error.js.
    let parsed
    try {
        parsed = await pdfParse(buffer)
    } catch (err) {
        console.error('[pdf] could not parse upload:', err.message)
        throw httpError(422, 'That PDF could not be read. If it is a scan or a photo, export it as a text-based PDF first.')
    }

    const text = parsed.text
    return text
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}