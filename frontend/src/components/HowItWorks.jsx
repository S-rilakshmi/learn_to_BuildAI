export default function HowItWorks() {
  return (
    <section id="how" className="how-section">
      <div className="container">
        <h2>How it works</h2>
        <div className="how-grid">
          <div className="card step">
            <span className="step-num">1</span>
            <h3>Upload a PDF</h3>
            <p>Drag and drop or browse, then paste the job description. Nothing is stored until you hit Analyze.</p>
          </div>
          <div className="card step">
            <span className="step-num">2</span>
            <h3>Skills get extracted</h3>
            <p>The server pulls the text out of the PDF and matches it against the keywords in your JD.</p>
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
