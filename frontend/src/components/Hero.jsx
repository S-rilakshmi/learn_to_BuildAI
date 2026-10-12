export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <p className="eyebrow">Resume × job description · keyword analysis</p>
        <h1>
          Know what your resume signals <span className="accent">before you send it</span>
        </h1>
        <p className="sub">
          Upload your resume PDF and paste the job description: the server reads
          the text out of the PDF, compares it against the JD's keywords, and shows
          the score, the skills present and the ones missing.
        </p>
        <a className="btn btn-primary" href="#upload">Upload a resume</a>
      </div>
    </section>
  )
}
