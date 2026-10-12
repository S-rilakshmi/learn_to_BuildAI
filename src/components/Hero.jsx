export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <p className="eyebrow">Mock demo · no backend</p>
        <h1>
          Know what your resume signals <span className="accent">before you send it</span>
        </h1>
        <p className="sub">
          Upload a PDF and get a score out of 100, the skills it found, and the
          ones it's missing. This page is a mock build — the real parsing logic
          plugs in later.
        </p>
        <a className="btn btn-primary" href="#upload">Upload a resume</a>
      </div>
    </section>
  )
}
