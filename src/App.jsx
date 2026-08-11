import { useState } from 'react';
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
import OnboardingFlow from './onboarding/OnboardingFlow';
import SignupPage from './auth/SignupPage';
import LoginPage from './auth/LoginPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import ResetPasswordPage from './auth/ResetPasswordPage';
import Workspace from './workspace/Workspace';
import BodyDiffTest from './dev/BodyDiffTest';
import { useAuth } from './auth/authContext';
import './onboarding/onboarding.css';
import './auth/auth.css';
import './workspace/workspace.css';

// 비밀번호 재설정 메일만 진짜 URL로 들어온다 — 나머지 화면은 view 상태로만 오간다.
// 라우터를 들이는 대신 이 한 경로만 처음 진입할 때 읽는다.
const RESET_PATH = '/reset-password';

function initialRoute() {
  if (typeof window === 'undefined' || window.location.pathname !== RESET_PATH) {
    return { view: 'landing', resetToken: null };
  }
  return {
    view: 'reset-password',
    resetToken: new URLSearchParams(window.location.search).get('token'),
  };
}

// 'landing' → 'onboarding'(3단계 + 미리보기) → 'signup' | 'login' → 'workspace'(튜토리얼 + 업로드/분석)
// 그 밖에 'forgot-password'와 'reset-password'(메일 링크로 직접 진입)가 있다.
export default function App() {
  const [route] = useState(initialRoute);
  const [view, setView] = useState(route.view);
  const { user, signIn, signOut } = useAuth();

  // 재설정 화면을 벗어나면 주소창의 ?token=...도 지운다. 남겨두면 새로고침할 때
  // 이미 써버린 토큰으로 다시 들어가 "만료됐어요"를 보게 된다.
  const leaveResetPage = (next) => {
    if (window.location.pathname === RESET_PATH) {
      window.history.replaceState(null, '', '/');
    }
    setView(next);
  };

  const goToOnboarding = () => setView('onboarding');
  const goToLanding = () => leaveResetPage('landing');
  const goToSignup = () => setView('signup');
  const goToLogin = () => leaveResetPage('login');
  const goToForgotPassword = () => leaveResetPage('forgot-password');

  // 사용자 정보 저장과 온보딩 답변 동기화는 AuthContext가 맡는다 — 여기서는 화면만 넘긴다.
  const handleAuthSuccess = async (loggedInUser) => {
    await signIn(loggedInUser);
    setView('workspace');
  };

  const handleLogout = async () => {
    await signOut();
    setView('landing');
  };

  // 임시 테스트 진입점 — /?dev=body-diff. 정식 라우팅에 넣지 않고 쿼리스트링으로만
  // 접근한다. 검증이 끝나면 이 분기와 src/dev/BodyDiffTest.jsx를 함께 지운다.
  if (new URLSearchParams(window.location.search).get('dev') === 'body-diff') {
    return <BodyDiffTest />;
  }

  if (view === 'onboarding') {
    return <OnboardingFlow onExit={goToLanding} onGoToSignup={goToSignup} onGoToLogin={goToLogin} />;
  }

  if (view === 'signup') {
    return <SignupPage onExit={goToLanding} onSwitchToLogin={goToLogin} onSuccess={handleAuthSuccess} />;
  }

  if (view === 'login') {
    return (
      <LoginPage
        onExit={goToLanding}
        onSwitchToSignup={goToSignup}
        onForgotPassword={goToForgotPassword}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (view === 'forgot-password') {
    return <ForgotPasswordPage onExit={goToLanding} onBackToLogin={goToLogin} />;
  }

  if (view === 'reset-password') {
    return (
      <ResetPasswordPage
        token={route.resetToken}
        onExit={goToLanding}
        onBackToLogin={goToLogin}
        onRequestNewLink={goToForgotPassword}
      />
    );
  }

  if (view === 'workspace') {
    return <Workspace user={user} onLogout={handleLogout} />;
  }

  return (
    <>
      <Header onGetStarted={goToOnboarding} onLogin={goToLogin} />
      <Hero onGetStarted={goToOnboarding} onLogin={goToLogin} />
      <GalleryCards />
      <ScopeStrip />
      <ProblemCompare />
      <ReviewSimulator />
      <ProcessSteps />
      <Features />
      <CtaBand onGetStarted={goToOnboarding} onLogin={goToLogin} />
      <Footer />
    </>
  );
}
