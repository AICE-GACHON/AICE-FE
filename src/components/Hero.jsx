import { Link } from 'react-router-dom';
import { useAuth } from '../auth/authContext';

export default function Hero() {
  const { status } = useAuth();
  const authed = status === 'authed';
  // Header.jsx와 같은 이유 — 세션 확인이 끝나기 전엔 guest로 단정하지 않는다.
  const loading = status === 'loading';

  return (
    <section className="hero">
      <h1>Read the reviews <span className="accent">papers like yours got.</span></h1>
      <p className="hero-sub">
        Upload your paper as a PDF. We read it — method, experiments, reference list — to pick the papers <br className="hero-sub-break" />
        genuinely closest to it, then show you the reviews they got, whether each one was accepted, and what reviewers kept asking for.
      </p>
      <div className="hero-actions">
        {loading ? null : authed ? (
          // 로그인 상태면 "Log in"·"Get started free" 둘 다 말이 안 된다(이미
          // 로그인했고 이미 시작했다) — 할 일이 하나뿐이니 버튼도 하나만 둔다.
          <Link to="/app" className="pill btn-lg">Analyze your paper <span>→</span></Link>
        ) : (
          <>
            <Link to="/onboarding" className="pill btn-lg">Get started free <span>→</span></Link>
            <Link to="/login" className="pill ghost btn-lg">Log in</Link>
          </>
        )}
      </div>
      {!loading && !authed && (
        <p className="fine">
          By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.<br />
          Currently built on public review data from AI conferences.
        </p>
      )}
    </section>
  );
}