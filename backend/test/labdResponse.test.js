import { test } from 'node:test'
import assert from 'node:assert/strict'

import { parseReview, sanitise, statusFor, messageFor, numberOrNull } from '../lib/labdResponse.js'

// These run with `node --test test/` from backend/ and need nothing installed -
// lib/labdResponse.js imports no config, no Express and no network, which is the
// point of keeping the parsing out of the service.

test('parses the clean JSON labd is asked for', () => {
    const review = parseReview('{"score":82,"verdict":"Good fit.","present":["React"],"missing":["Docker"]}')
    assert.deepEqual(review, { score: 82, verdict: 'Good fit.', present: ['React'], missing: ['Docker'] })
})

test('parses an answer wrapped in a markdown fence', () => {
    const raw = '```json\n{"score":70,"verdict":"","present":["Node.js"],"missing":[]}\n```'
    assert.equal(parseReview(raw).score, 70)
})

test('parses an answer with a sentence in front of the JSON', () => {
    const raw = 'Here is the review:\n{"score":55,"verdict":"Partial.","present":["CSS"],"missing":["Go"]}'
    assert.equal(parseReview(raw).score, 55)
})

test('clamps a score outside 0-100 and rounds a float', () => {
    assert.equal(sanitise({ score: 140, present: ['a'], missing: [] }).score, 100)
    assert.equal(sanitise({ score: -12, present: ['a'], missing: [] }).score, 0)
    assert.equal(sanitise({ score: 71.6, present: ['a'], missing: [] }).score, 72)
})

test('rejects an answer that is not usable', () => {
    assert.equal(parseReview(''), null)
    assert.equal(parseReview('I could not read that resume.'), null)
    assert.equal(parseReview('{"score":80,"present":[],"missing":[]}'), null, 'no skills at all is not a review')
    assert.equal(parseReview('{"present":["React"],"missing":[]}'), null, 'score is required')
})

test('drops non-string entries from the skill lists and caps their length', () => {
    const review = sanitise({
        score: 60,
        present: ['React', 42, null, '  Node.js  '],
        missing: Array.from({ length: 40 }, (_, i) => `skill-${i}`),
    })
    assert.deepEqual(review.present, ['React', 'Node.js'])
    assert.equal(review.missing.length, 15)
})

test('maps labd statuses to the ones this server answers with', () => {
    assert.equal(statusFor(401), 503, 'a bad key is the server’s problem, not the learner’s')
    assert.equal(statusFor(402), 503, 'allowance used up')
    assert.equal(statusFor(403), 503)
    assert.equal(statusFor(429), 429)
    assert.equal(statusFor(500), 502)
})

test('turns a labd status into a message someone can act on', () => {
    assert.match(messageFor(401, null), /LABD_API_KEY/)
    assert.match(messageFor(429, null), /Wait a moment/)
    assert.match(messageFor(500, { error: 'upstream boom' }), /upstream boom/)
})

test('numberOrNull keeps 0 and discards non-numbers', () => {
    assert.equal(numberOrNull(0), 0)
    assert.equal(numberOrNull('42'), 42)
    assert.equal(numberOrNull(undefined), null)
    assert.equal(numberOrNull('soon'), null)
})