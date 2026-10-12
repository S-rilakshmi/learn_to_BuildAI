export default function HowItWorks() {
  return (
    <section id="how" className="how-section">
      <div className="container">
        <h2>How it works</h2>
        <div className="how-grid">
          <div className="card step">
            <span className="step-num">1</span>
            <h3>Upload a PDF</h3>
            <p>Drag and drop or browse. In this mock, nothing leaves your browser.</p>
          </div>
          <div className="card step">
            <span className="step-num">2</span>
            <h3>Skills get extracted</h3>
            <p>In the real build, a parser reads the PDF text and matches it against a skill list.</p>
          </div>
          <div className="card step">
            <span className="step-num">3</span>
            <h3>See score and gaps</h3>
            <p>A score out of 100, the skills present, and the skills missing — at a glance.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
