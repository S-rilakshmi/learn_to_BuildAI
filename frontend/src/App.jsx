import { useState } from 'react'
import UploadCard from './components/UploadCard.jsx'
import ScoreCard from './components/ScoreCard.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import Hero from './components/Hero.jsx'
import './App.css'

export default function App() {
  // Null means "no result yet"; after analysis it holds
  // { score, present, missing, fileName }.
  const [result, setResult] = useState(null)

  const handleAnalyzed = (parsed) => setResult(parsed)

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <a className="logo" href="#top">0 <span className="arrow">→</span> Shipped</a>
          <nav>
            <a href="#upload">Try it</a>
            <a href="#how">How it works</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <Hero />
        <UploadCard onAnalyzed={handleAnalyzed} />
        {/* The results section only mounts once a result exists —
            conditional rendering replaces the old show/hide toggling. */}
        {result && (
          <section id="results" className="results-section">
            <div className="container">
              <ScoreCard result={result} />
            </div>
          </section>
        )}
        <HowItWorks />
      </main>
      <footer className="footer">
        <div className="container">
          <p>0 → Shipped · Resume Parser — React frontend, Express + MongoDB backend.</p>
        </div>
      </footer>
    </>
  )
}
