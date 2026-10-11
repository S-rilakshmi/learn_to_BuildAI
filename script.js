// ============================================================
// 0 → Shipped · Resume Parser (mock front-end)
//
// No backend: picking a PDF runs a *mock* parser in the browser
// that returns a deterministic demo result. The result is seeded
// from the file name, so the same file always gets the same
// score — it feels like real parsing without needing one.
//
// To go real later: replace mockParse() with a call to your
// parser backend and keep renderResult() as-is.
// ============================================================

// ---- elements ----
const fileInput = document.getElementById("file-input");
const dropzone = document.getElementById("dropzone");
const browseBtn = document.getElementById("browse-btn");
const fileNote = document.getElementById("file-note");
const errorNote = document.getElementById("error-note");
const analyzeBtn = document.getElementById("analyze-btn");
const resultsSection = document.getElementById("results-section");
const loading = document.getElementById("loading");
const loadingFile = document.getElementById("loading-file");
const result = document.getElementById("result");
const ringFill = document.getElementById("ring-fill");
const scoreNumber = document.getElementById("score-number");
const resultFile = document.getElementById("result-file");
const verdict = document.getElementById("verdict");
const presentCount = document.getElementById("present-count");
const missingCount = document.getElementById("missing-count");
const presentList = document.getElementById("present-list");
const missingList = document.getElementById("missing-list");

// ---- mock data ----
const ALL_SKILLS = [
    "JavaScript", "TypeScript", "Python", "SQL", "React", "Node.js",
    "REST APIs", "Git", "Docker", "AWS", "CI/CD", "Unit testing",
];

// ---- state ----
let selectedFile = null;

// The ring's circumference: r = 52 in the SVG, so 2·π·r ≈ 326.7
const RING_LENGTH = 2 * Math.PI * 52;

// ---------- file selection ----------
dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
    }
});
// The "browse files" button sits inside the dropzone; stopping the
// event here keeps the file dialog from opening twice via bubbling.
browseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
});

dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragging");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragging"));
dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragging");
    handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));

function handleFile(file) {
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
        showError("That's not a PDF — please choose a .pdf file.");
        return;
    }

    selectedFile = file;
    errorNote.hidden = true;
    fileNote.hidden = false;
    fileNote.textContent = `${file.name} · ${prettySize(file.size)} selected`;
    analyzeBtn.disabled = false;
}

function showError(message) {
    selectedFile = null;
    fileNote.hidden = true;
    errorNote.hidden = false;
    errorNote.textContent = message;
    analyzeBtn.disabled = true;
}

function prettySize(bytes) {
    return bytes < 1024 * 1024 ?
        `${Math.round(bytes / 1024)} KB` :
        `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ---------- analyze ----------
analyzeBtn.addEventListener("click", () => {
    if (!selectedFile) return;

    result.hidden = true;
    loading.hidden = false;
    loadingFile.textContent = selectedFile.name;
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing…";

    // Fake parsing delay so the loading state is visible.
    setTimeout(() => {
        const parsed = mockParse(selectedFile.name);
        renderResult(parsed);
        loading.hidden = true;
        result.hidden = false;
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze resume";
        resultsSection.scrollIntoView({ behavior: "smooth" });
    }, 1100);
});

// ---------- mock parser ----------
// Deterministic per file name: hash the name into a seed, then use
// a seeded random generator so the same file always scores the same.
function mockParse(fileName) {
    const rand = mulberry32(hashString(fileName));

    // Fisher–Yates shuffle, seeded.
    const pool = [...ALL_SKILLS];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const presentCount = 6 + Math.floor(rand() * 4); // 6–9 of 12
    const present = pool.slice(0, presentCount).sort();
    const missing = pool.slice(presentCount).sort();
    const score = 52 + Math.floor(rand() * 37); // 52–88

    return { score, present, missing };
}

function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function mulberry32(seed) {
    return function() {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ---------- rendering ----------
function renderResult({ score, present, missing }) {
    resultFile.textContent = `${selectedFile.name} · mock analysis`;

    presentCount.textContent = `(${present.length})`;
    missingCount.textContent = `(${missing.length})`;
    fillChips(presentList, present, "present");
    fillChips(missingList, missing, "missing");

    // Color and verdict depend on the score band.
    const { color, text } = scoreBand(score);
    verdict.textContent = text;
    ringFill.style.stroke = color;

    animateRing(score);
    animateScore(score);
}

function fillChips(list, skills, kind) {
    list.innerHTML = "";
    for (const skill of skills) {
        const li = document.createElement("li");
        li.className = `chip ${kind}`;
        li.textContent = skill;
        list.appendChild(li);
    }
}

function scoreBand(score) {
    if (score >= 80) return { color: "#16a34a", text: "Strong match — most of the skills this screen looks for are on the page." };
    if (score >= 65) return { color: "#d97706", text: "Good base — a couple of key skills are missing or not visible." };
    return { color: "#dc2626", text: "Weak match — several core skills are missing. Worth adding projects that use them." };
}

function animateRing(score) {
    ringFill.style.strokeDasharray = RING_LENGTH;
    ringFill.style.strokeDashoffset = RING_LENGTH; // start empty
    ringFill.getBoundingClientRect(); // force a reflow so the transition below runs
    ringFill.style.strokeDashoffset = RING_LENGTH * (1 - score / 100);
}

function animateScore(target) {
    const duration = 900;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out
        scoreNumber.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}