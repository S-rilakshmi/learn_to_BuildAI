import { createRequire } from 'node:module'

// pdf-parse is a CommonJS package and is also known to look for a debug file
// at import time on some versions, so build the require from this module's URL
// instead of a bare `import`.
const require = createRequire(
    import.meta.url)
const pdfParse = require('pdf-parse')

// Turns a PDF buffer into clean plain text. Knows nothing about HTTP: it is
// handed a Buffer and returns a string (or '' if the PDF had no text layer).
export async function extractPdfText(buffer) {
    const { text } = await pdfParse(buffer)
    return text
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}