// ============================================================
// Mock parser — stands in for the real backend.
//
// Deterministic per file name: hash the name into a seed, then use
// a seeded random generator so the same file always gets the same
// score — it feels like real parsing without needing a server.
//
// To go real later: swap this module for a fetch() to your parser
// backend that returns { score, present, missing }. The components
// don't care where the object comes from.
// ============================================================

const ALL_SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'SQL', 'React', 'Node.js',
    'REST APIs', 'Git', 'Docker', 'AWS', 'CI/CD', 'Unit testing',
]

export default function mockParse(fileName) {
    const rand = mulberry32(hashString(fileName))

    // Fisher–Yates shuffle, seeded.
    const pool = [...ALL_SKILLS]
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]]
    }

    const presentCount = 6 + Math.floor(rand() * 4) // 6–9 of 12
    const present = pool.slice(0, presentCount).sort()
    const missing = pool.slice(presentCount).sort()
    const score = 52 + Math.floor(rand() * 37) // 52–88

    return { score, present, missing }
}

function hashString(str) {
    let h = 2166136261
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

function mulberry32(seed) {
    return function() {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}