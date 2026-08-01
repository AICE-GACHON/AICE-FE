export default function CtaBand({ onGetStarted }) {
  return (
    <section id="pricing">
      <div className="wrap">
        <div className="cta-band">
          <h2>One more look, through a reviewer's eyes, before you submit</h2>
          <p>Sign up free with your school email.</p>
          <div className="hero-actions">
            <button type="button" className="pill btn-lg primary" onClick={onGetStarted}>Get started free <span>→</span></button>
            <a className="pill ghost btn-lg" href="#demo">Request a demo</a>
          </div>
        </div>
      </div>
    </section>
  );
}