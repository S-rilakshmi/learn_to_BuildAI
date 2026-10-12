import { normalise, words, escapeRegex } from '../utils.js'

// ============================================================
// The stand-in for the AI step. It is deliberately dumb and
// deterministic: pull candidate phrases out of the JD, then check
// which of them appear in the resume text.
//
// It lives in one file behind one function (`findKeywords` + the
// scorer in service/analyzeService.js) so the real model can replace
// it later without any caller changing.
//
// The text helpers it shares with the rest of the backend
// (normalise, words, escapeRegex) now live in backend/utils.js.
// ============================================================

// Words that show up in every JD and say nothing about fit.
const STOP_WORDS = new Set([
    'and', 'the', 'for', 'with', 'you', 'your', 'our', 'are', 'will', 'have',
    'this', 'that', 'from', 'what', 'when', 'who', 'how', 'all', 'any', 'can',
    'has', 'been', 'more', 'most', 'other', 'such', 'than', 'then', 'them',
    'these', 'they', 'into', 'over', 'out', 'own', 'very', 'not', 'but', 'about',
    'also', 'able', 'across', 'after', 'again', 'against', 'because', 'before',
    'being', 'between', 'both', 'each', 'few', 'further', 'here', 'its', 'just',
    'like', 'make', 'many', 'might', 'must', 'need', 'needs', 'only', 'same',
    'should', 'some', 'still', 'their', 'there', 'through', 'under', 'until',
    'using', 'use', 'used', 'uses', 'want', 'well', 'were', 'while', 'work',
    'working', 'would', 'years', 'year', 'plus', 'job', 'role', 'team', 'teams',
    'company', 'candidate', 'candidates', 'youll', 'will', 'ideally', 'strong',
    'good', 'great', 'excellent', 'solid', 'experience', 'experiences',
    'knowledge', 'understanding', 'familiarity', 'proficient', 'proficiency',
    'ability', 'someone', 'looking', 'join', 'help', 'build', 'building',
    'develop', 'developing', 'maintain', 'design', 'designing', 'implement',
    'support', 'supporting', 'required', 'requirements', 'responsibilities',
    'preferred', 'nice', 'must', 'etc', 'including', 'include', 'includes',
    'related', 'field', 'degree', 'bachelor', 'bachelors', 'masters', 'science',
    'computer', 'engineering', 'or', 'of', 'to', 'in', 'on', 'at', 'as', 'is',
    'be', 'we', 'it', 'an', 'a', 'by', 'if', 'do', 'does', 'no', 'yes',
])

// Well-known stacks and tools, so "react" in a JD turns into "React" in the
// output and multi-word names survive tokenising.
const KNOWN_TECH = [
    'JavaScript', 'TypeScript', 'React', 'React Native', 'Next.js', 'Vue',
    'Angular', 'Svelte', 'Node.js', 'Express', 'NestJS', 'Python', 'Django',
    'Flask', 'FastAPI', 'Java', 'Spring Boot', 'Kotlin', 'Swift', 'Go', 'Rust',
    'C++', 'C#', '.NET', 'PHP', 'Laravel', 'Ruby', 'Rails', 'SQL', 'PostgreSQL',
    'MySQL', 'SQLite', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs', 'gRPC',
    'HTML', 'CSS', 'SASS', 'Tailwind CSS', 'Bootstrap', 'Git', 'GitHub Actions',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'CI/CD',
    'Jenkins', 'Linux', 'Nginx', 'Kafka', 'RabbitMQ', 'Webpack', 'Vite',
    'Jest', 'Vitest', 'Cypress', 'Playwright', 'Unit testing', 'TDD',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas',
    'NumPy', 'LLM', 'NLP', 'Prompt engineering', 'Jira', 'Figma', 'Agile',
    'Scrum', 'Microservices', 'Serverless', 'WebSockets', 'OAuth', 'JWT',
]

const KNOWN_TECH_LOOKUP = new Map(KNOWN_TECH.map((t) => [t.toLowerCase(), t]))

// Everything we consider worth comparing: known tech found in the JD first
// (they are the most meaningful), then the remaining significant words.
export function findKeywords(jobDescription) {
    const jd = normalise(jobDescription)
    const found = new Map()

    for (const tech of KNOWN_TECH) {
        const pattern = new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(tech.toLowerCase())}([^a-z0-9+#.]|$)`)
        if (pattern.test(jd)) found.set(tech.toLowerCase(), tech)
    }

    for (const word of words(jd)) {
        if (word.length < 3) continue
        if (STOP_WORDS.has(word)) continue
        if (KNOWN_TECH_LOOKUP.has(word)) continue
        if (found.has(word)) continue
        found.set(word, word)
    }

    const known = [...found.values()].filter((k) => KNOWN_TECH_LOOKUP.has(k.toLowerCase()))
    const rest = [...found.values()].filter((k) => !KNOWN_TECH_LOOKUP.has(k.toLowerCase()))
    return [...known, ...rest].slice(0, 30)
}

export function scoreKeywords(resumeText, targets) {
    const resume = normalise(resumeText)
    const resumeWords = new Set(words(resume))
    const resumeRaw = ` ${resume} `

    const present = []
    const missing = []

    for (const target of targets) {
        if (containsSkill(target, resumeWords, resumeRaw)) present.push(target)
        else missing.push(target)
    }

    return {
        score: scoreOf(present, targets),
        present,
        missing,
        matchedKeywords: present.map((s) => s.toLowerCase()),
    }
}

function containsSkill(skill, resumeWords, resumeRaw) {
    if (skill.includes(' ') || /[.+#]/.test(skill)) {
        return resumeRaw.includes(` ${skill.toLowerCase()} `) ||
            resumeRaw.includes(` ${skill.toLowerCase()},`) ||
            resumeRaw.includes(` ${skill.toLowerCase()}.`)
    }
    const stem = skill.toLowerCase().replace(/(ing|ed|es|s)$/, '')
    if (resumeWords.has(skill.toLowerCase())) return true
    return [...resumeWords].some((w) => w.length > 3 && w.replace(/(ing|ed|es|s)$/, '') === stem)
}

function scoreOf(present, targets) {
    const ratio = present.length / targets.length
        // 0.6 base so a partial match reads as "promising" rather than failing,
        // capped just under 100 because a keyword match is not real evidence.
    return Math.min(97, Math.round(45 + 52 * ratio))
}