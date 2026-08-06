import googleLogo from '../assets/Google.png';

export default function CtaBand({ onGetStarted, onLogin }) {
  return (
    <section id="pricing">
      <div className="wrap">
        <div className="cta-band">
          <h2>See what reviewers said about papers like yours — before you submit</h2>
          <p>Free to get started.</p>
          <div className="hero-actions">
            <button type="button" className="pill btn-lg primary" onClick={onGetStarted}>Get started free <span>→</span></button>
            <button type="button" className="pill ghost btn-lg cta-google-btn" onClick={onLogin}>
              <img src={googleLogo} alt="" className="cta-google-icon" />
              Log in with Google
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
