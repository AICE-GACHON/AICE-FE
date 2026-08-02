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
import Workspace from './workspace/Workspace';
import { logout } from './api/auth';
import './onboarding/onboarding.css';
import './auth/auth.css';
import './workspace/workspace.css';

// 'landing' → 'onboarding'(3단계 + 미리보기) → 'signup' | 'login' → 'workspace'(튜토리얼 + 업로드/분석)
export default function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);

  const goToOnboarding = () => setView('onboarding');
  const goToLanding = () => setView('landing');
  const goToSignup = () => setView('signup');
  const goToLogin = () => setView('login');

  const handleAuthSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setView('workspace');
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setView('landing');
  };

  if (view === 'onboarding') {
    return <OnboardingFlow onExit={goToLanding} onGoToSignup={goToSignup} onGoToLogin={goToLogin} />;
  }

  if (view === 'signup') {
    return <SignupPage onExit={goToLanding} onSwitchToLogin={goToLogin} onSuccess={handleAuthSuccess} />;
  }

  if (view === 'login') {
    return <LoginPage onExit={goToLanding} onSwitchToSignup={goToSignup} onSuccess={handleAuthSuccess} />;
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
