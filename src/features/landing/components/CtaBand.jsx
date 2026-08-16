import { Link } from 'react-router-dom';
import googleLogo from '@/assets/Google.png';

export default function CtaBand() {
  return (
    <section id="pricing">
      <div className="wrap">
        <div className="cta-band">
          <h2>See what reviewers said about papers like yours — before you submit</h2>
          <p>Free to get started.</p>
          <div className="hero-actions">
            <Link to="/onboarding" className="pill btn-lg primary">Get started free <span>→</span></Link>
            {/* 구글 로그인 자체는 로그인 화면의 버튼이 처리한다 — 여기서는 그 화면으로만 보낸다. */}
            <Link to="/login" className="pill ghost btn-lg cta-google-btn">
              <img src={googleLogo} alt="" className="cta-google-icon" />
              Log in with Google
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
