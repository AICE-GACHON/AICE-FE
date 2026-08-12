import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="hero">
      <h1>Read the reviews <span className="accent">papers like yours got.</span></h1>
      <p className="hero-sub">
        Upload your paper as a PDF. We read it — method, experiments, reference list — to pick the papers <br className="hero-sub-break" />
        that are genuinely closest to it, then show you the reviews those papers actually received, in full.
      </p>
      <div className="hero-actions">
        <Link to="/onboarding" className="pill btn-lg">Get started free <span>→</span></Link>
        <Link to="/login" className="pill ghost btn-lg">Log in</Link>
      </div>
      <p className="fine">
        By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.<br />
        Currently built on public review data from AI conferences.
      </p>
    </section>
  );
}