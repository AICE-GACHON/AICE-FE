export default function Hero({ onGetStarted, onLogin }) {
  return (
    <section className="hero">
      <h1>Write it. We'll show you <span className="accent">the review first.</span></h1>
      <p className="hero-sub">
        Paste your title and abstract, or upload a PDF — we find similar papers ranked by real match signals, <br className="hero-sub-break" />
        then open any of them into the actual reviews, rebuttals, and revisions they went through, plus the review patterns and venue trends for your topic.
      </p>
      <div className="hero-actions">
        <button type="button" className="pill btn-lg" onClick={onGetStarted}>Get started free <span>→</span></button>
        <button type="button" className="pill ghost btn-lg" onClick={onLogin}>Log in</button>
      </div>
      <p className="fine">
        By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.<br />
        Currently built on public review data from AI conferences.
      </p>
    </section>
  );
}