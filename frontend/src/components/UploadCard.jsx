import { useRef, useState } from 'react'
import { analyzeResume } from '../lib/api.js'

export default function UploadCard({ onAnalyzed }) {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef(null)

  function pickFile(f) {
    if (!f) return
    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setFile(null)
      setError('That’s not a PDF — please choose a .pdf file.')
      return
    }
    setFile(f)
    setError('')
  }

  async function analyze() {
    if (!file || busy) return
    setBusy(true)
    setError('')
    try {
      // The PDF and the JD go to the Express server, which reads the text out
      // of the PDF, compares it with the JD and stores the result in Mongo.
      const result = await analyzeResume(file, jobDescription)
      onAnalyzed(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }

  }

  return (
    <section id="upload" className="upload-section">
      <div className="container">
        <div className="card upload-card">
          <input
            type="file"
            accept="application/pdf,.pdf"
            hidden
            ref={fileInputRef}
            onChange={(e) => pickFile(e.target.files[0])}
          />

          <div
            className="dropzone"
            role="button"
            tabIndex={0}
            aria-label="Upload resume PDF"
            onClick={() => fileInputRef.current.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileInputRef.current.click()
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              pickFile(e.dataTransfer.files[0])
            }}
          >
            <svg className="dz-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12 16V4m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" />
            </svg>
            <p className="dz-title">Drag &amp; drop your resume PDF</p>
            <p className="dz-sub">
              or{' '}
              <button
                type="button"
                className="link-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current.click()
                }}
              >
                browse files
              </button>
            </p>
            <p className="dz-hint">PDF only · up to 5 MB · text-based PDFs</p>
          </div>

          <label className="jd-field">
            <span className="jd-label">Paste the job description</span>
            <textarea
              className="jd-input"
              rows={7}
              placeholder="Paste the JD you're targeting — the score compares your resume against this text."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </label>

          {file && (
            <p className="file-note">
              {file.name} · {file.size < 1024 * 1024
                ? `${Math.round(file.size / 1024)} KB`
                : `${(file.size / 1024 / 1024).toFixed(1)} MB`}{' '}
              selected
            </p>
          )}
          {error && <p className="error-note">{error}</p>}

          <button
            type="button"
            className="btn btn-primary"
            disabled={!file || !jobDescription.trim() || busy}
            onClick={analyze}
          >
            {busy ? 'Analyzing…' : 'Analyze resume'}
          </button>
        </div>
      </div>
    </section>
  )
}
