import { analyzeResume, listAnalyses } from '../service/analyzeService.js'

// The HTTP layer, and only that: read the request, call a service, choose a
// status code. All the thinking lives in service/analyzeService.js, so this
// file has nothing to say about PDFs or keywords.
//
// `next` is not used in the success path - Express needs the parameter present
// on these async handlers so a rejected promise is passed to the error
// middleware rather than becoming an unhandled rejection.

export async function postAnalyze(req, res, next) {
    try {
        const result = await analyzeResume({
            file: req.file,
            jobDescription: req.body.jobDescription,
        })
        res.status(201).json(result)
    } catch (err) {
        next(err)
    }
}

export async function getAnalyses(_req, res, next) {
    try {
        res.json(await listAnalyses())
    } catch (err) {
        next(err)
    }
}