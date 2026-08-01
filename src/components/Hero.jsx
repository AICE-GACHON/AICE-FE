export default function Hero({ onGetStarted, onLogin }) {
  return (
    <section className="hero">
      <h1>Write it. We'll show you <span className="accent">the review first.</span></h1>
      <p className="hero-sub">
        We connect the real reviews similar papers received with <br />how they were revised — so you can see your draft through <br />a reviewer's eyes before you submit.
      </p>
      <div className="hero-actions">
        <button type="button" className="pill btn-lg" onClick={onGetStarted}>Get started free <span>→</span></button>
        <button type="button" className="pill ghost btn-lg" onClick={onLogin}>Log in with Google</button>
      </div>
      <p className="fine">
        By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.<br />
        Currently built on public review data from AI conferences.
      </p>
    </section>
  );
}