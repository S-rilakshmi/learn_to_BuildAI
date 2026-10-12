import { useEffect, useState } from 'react'

// The ring's circumference: r = 52 in the SVG, so 2·π·r ≈ 326.7
const RING_LENGTH = 2 * Math.PI * 52

export default function ScoreCard({ result: { score, present, missing, fileName } }) {
  const [shownScore, setShownScore] = useState(0)
  const [filled, setFilled] = useState(false)

  // Start the ring empty, then flip `filled` on the next frame so the
  // CSS transition on stroke-dashoffset animates from 0 to the score.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Count the score number up with an ease-out curve.
  useEffect(() => {
    const duration = 900
    const start = performance.now()
    let raf
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setShownScore(Math.round(eased * score))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])

  const { color, text } = scoreBand(score)
  const ringOffset = filled ? RING_LENGTH * (1 - score / 100) : RING_LENGTH

  return (
    <div className="card results-card">
      <div className="result-head">
        <div className="ring-wrap">
          <svg className="ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle className="ring-track" cx="60" cy="60" r="52" />
            <circle
              className="ring-fill"
              cx="60" cy="60" r="52"
              stroke={color}
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={ringOffset}
            />
          </svg>
          <div className="ring-label">
            <span>{shownScore}</span>
            <span className="ring-max">/100</span>
          </div>
        </div>
        <div className="result-summary">
          <h2>Resume score</h2>
          <p className="result-file">{fileName} · mock analysis</p>
          <p className="verdict">{text}</p>
          <p className="demo-note">
            Mock result — generated in the browser so the demo runs without a backend.
          </p>
        </div>
      </div>

      <div className="skills-grid">
        <SkillsColumn title="Present skills" skills={present} kind="present" />
        <SkillsColumn title="Missing skills" skills={missing} kind="missing" />
      </div>
    </div>
  )
}

function SkillsColumn({ title, skills, kind }) {
  return (
    <div className="skills-col">
      <h3>
        {title} <span className="count">({skills.length})</span>
      </h3>
      <ul className="chips">
        {skills.map((skill) => (
          <li key={skill} className={`chip ${kind}`}>{skill}</li>
        ))}
      </ul>
    </div>
  )
}

function scoreBand(score) {
  if (score >= 80) return { color: '#16a34a', text: 'Strong match — most of the skills this screen looks for are on the page.' }
  if (score >= 65) return { color: '#d97706', text: 'Good base — a couple of key skills are missing or not visible.' }
  return { color: '#dc2626', text: 'Weak match — several core skills are missing. Worth adding projects that use them.' }
}
