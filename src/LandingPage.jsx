// 랜딩(/). App.jsx가 화면 분기를 들고 있을 때는 이 조각들이 App의 return문에
// 그대로 널려 있었다. 이제 App은 라우터만 들고 있으므로 한 화면으로 묶는다.
//
// "시작하기"·"로그인" 이동은 콜백 prop 대신 각 컴포넌트 안의 <Link>가 맡는다 —
// 랜딩은 이 페이지가 어디로 가는지 알 필요가 없다.
//
// 로그인 상태에서도 대시보드로 옮기지 않고 이 페이지를 그대로 메인 화면으로
// 쓴다(Notion과 같은 패턴 — Header가 버튼만 바꾼다). 대신 재방문할 때마다
// 마케팅 콘텐츠를 다시 보고 싶지 않은 사람을 위해, 로그인 상태로 처음 왔을
// 때만 "다음부턴 바로 앱으로" 선택지를 준다.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/authContext';
import Header from './components/Header';
import Hero from './components/Hero';
import GalleryCards from './components/GalleryCards';
import ScopeStrip from './components/ScopeStrip';
import ProblemCompare from './components/ProblemCompare';
import ReviewSimulator from './components/ReviewSimulator';
import ProcessSteps from './components/ProcessSteps';
import Features from './components/Features';
import CtaBand from './components/CtaBand';
import Footer from './components/Footer';

const SKIP_LANDING_KEY = 'paper-trace:skip_landing';
// 앱의 기본 진입점. 업로드 폼을 직접 가리키지 않고 /app에 맡긴다 — 거기서 분석
// 이력 유무로 업로드 폼/내 논문을 갈라 준다(routes.jsx의 AppEntry, 이슈 #26).
const APP_HOME = '/app';

function hasSkipPreference() {
  try {
    return localStorage.getItem(SKIP_LANDING_KEY) === '1';
  } catch {
    return false; // localStorage 사용 불가 환경 — 매번 랜딩을 보여주는 쪽이 안전하다
  }
}

function SkipLandingPrompt({ onAccept, onDismiss }) {
  return (
    <div className="skip-landing-banner">
      <span>Skip this page next time you log in and go straight to your analysis?</span>
      <div className="skip-landing-actions">
        <button type="button" className="txt-link" onClick={onAccept}>Yes, always skip</button>
        <button type="button" className="skip-landing-close" onClick={onDismiss} aria-label="Dismiss">✕</button>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const authed = status === 'authed';
  // "항상 이동"을 이미 선택했는지는 렌더 중에 바로 판단할 수 있는 값이라 state로
  // 안 둔다 — 안 다뤄진 건 "이번 방문에서 배너를 닫았는지"뿐이다.
  const [dismissed, setDismissed] = useState(false);
  const skipPreferred = authed && hasSkipPreference();
  const showPrompt = authed && !skipPreferred && !dismissed;

  // 이미 "항상 이동"을 선택한 사람은 이 페이지를 볼 필요가 없다 — 리다이렉트한다.
  useEffect(() => {
    if (skipPreferred) navigate(APP_HOME, { replace: true });
  }, [skipPreferred, navigate]);

  const acceptSkip = () => {
    try {
      localStorage.setItem(SKIP_LANDING_KEY, '1');
    } catch {
      // 저장이 안 돼도 이번 이동 자체는 그대로 진행한다 — 다음에 또 물어볼 뿐이다
    }
    navigate(APP_HOME);
  };

  return (
    <>
      <Header />
      {showPrompt && (
        <SkipLandingPrompt onAccept={acceptSkip} onDismiss={() => setDismissed(true)} />
      )}
      <Hero />
      <GalleryCards />
      <ScopeStrip />
      <ProblemCompare />
      <ReviewSimulator />
      <ProcessSteps />
      <Features />
      <CtaBand />
      <Footer />
    </>
  );
}
