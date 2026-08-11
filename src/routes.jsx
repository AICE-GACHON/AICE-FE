// 앱의 주소 지도. 화면 전환이 state였을 때는 이 표가 App.jsx의 if문 더미로 흩어져
// 있었고, 새로고침 한 번이면 전부 랜딩으로 돌아갔다.
//
// 화면 컴포넌트들은 그대로 둔다. onExit·onSwitchToLogin 같은 콜백 prop을 받는
// 순수한 화면으로 남기고, 여기 얇은 래퍼가 useNavigate로 그 콜백을 채워 넣는다.
// 화면이 라우터를 몰라야 나중에 어디에 갖다 붙여도 그대로 동작한다.
import { useCallback } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import LandingPage from './LandingPage';
import OnboardingFlow from './onboarding/OnboardingFlow';
import SignupPage from './auth/SignupPage';
import LoginPage from './auth/LoginPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import ResetPasswordPage from './auth/ResetPasswordPage';
import WorkspaceLayout from './workspace/WorkspaceLayout';
import UploadPage from './workspace/UploadPage';
import MyPage from './workspace/MyPage';
import BodyDiffTest from './dev/BodyDiffTest';
import { RequireAuth, RedirectIfAuthed } from './auth/guards';
import { useAuth } from './auth/authContext';
import { parseStep } from './onboarding/steps';

// 온보딩은 단계마다 주소가 있다(/onboarding/1..4). 3단계에서 뒤로가기를 눌렀을 때
// 앱을 벗어나는 대신 2단계로 가야 하기 때문이다.
//
// 단계가 바뀌어도 이 컴포넌트는 언마운트되지 않는다 — 같은 라우트의 파라미터만
// 바뀌므로 React가 자리를 유지한다. 그래서 답변 state가 단계 사이에 살아남는다.
function OnboardingRoute() {
  const navigate = useNavigate();
  const { step: rawStep } = useParams();

  // OnboardingFlow가 매 렌더마다 새 함수를 받지 않도록 고정한다.
  const handleStepChange = useCallback(
    (next, options) => navigate(`/onboarding/${next}`, options),
    [navigate],
  );

  // 'abc', '99', '-1' 같은 값 — 주소를 직접 고쳐 넣은 경우다. 1단계로 되돌린다.
  const step = parseStep(rawStep);
  if (step === null) return <Navigate to="/onboarding/1" replace />;

  return (
    <OnboardingFlow
      step={step}
      onStepChange={handleStepChange}
      onExit={() => navigate('/')}
      onGoToSignup={() => navigate('/signup')}
      onGoToLogin={() => navigate('/login')}
    />
  );
}

// 로그인·회원가입 성공 뒤 어디로 갈지는 여기서 정하지 않는다 — signIn으로 authed가
// 되는 순간 RedirectIfAuthed가 ?next=를 보고 옮겨준다. 여기서도 navigate하면
// 두 판단이 경쟁해서 ?next=가 조용히 무시된다.
//
// 로그인 ↔ 회원가입을 오갈 때는 ?next=를 들고 다녀야 한다. 안 그러면 워크스페이스로
// 가려다 로그인 화면에 걸린 사람이 "회원가입"을 누른 순간 목적지를 잃는다.
function SignupRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  return (
    <SignupPage
      onExit={() => navigate('/')}
      onSwitchToLogin={() => navigate({ pathname: '/login', search: location.search })}
      onSuccess={signIn}
    />
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  return (
    <LoginPage
      onExit={() => navigate('/')}
      onSwitchToSignup={() => navigate({ pathname: '/signup', search: location.search })}
      onForgotPassword={() => navigate('/forgot-password')}
      onSuccess={signIn}
    />
  );
}

function ForgotPasswordRoute() {
  const navigate = useNavigate();
  return (
    <ForgotPasswordPage onExit={() => navigate('/')} onBackToLogin={() => navigate('/login')} />
  );
}

// 메일 링크로만 들어오는 화면. 예전에는 App이 첫 렌더에 pathname을 읽고,
// 화면을 벗어날 때 history.replaceState로 ?token=을 손수 지웠다 —
// 남겨두면 새로고침할 때 이미 써버린 토큰으로 다시 들어가 "만료됐어요"를 본다.
// 이제 라우터가 '/'로 옮겨가며 쿼리스트링째 두고 나온다.
function ResetPasswordRoute() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <ResetPasswordPage
      token={params.get('token')}
      onExit={() => navigate('/')}
      onBackToLogin={() => navigate('/login')}
      onRequestNewLink={() => navigate('/forgot-password')}
    />
  );
}

function MyPageRoute() {
  const { user } = useAuth();
  return <MyPage user={user} />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* 랜딩의 "시작하기"는 /onboarding으로 온다. replace라서 1단계에서 뒤로가면 랜딩이다. */}
      <Route path="/onboarding" element={<Navigate to="/onboarding/1" replace />} />
      <Route path="/onboarding/:step" element={<OnboardingRoute />} />

      <Route path="/signup" element={<RedirectIfAuthed><SignupRoute /></RedirectIfAuthed>} />
      <Route path="/login" element={<RedirectIfAuthed><LoginRoute /></RedirectIfAuthed>} />
      <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
      {/* 재설정은 가드를 걸지 않는다 — 로그인한 채로 메일 링크를 누를 수 있다. */}
      <Route path="/reset-password" element={<ResetPasswordRoute />} />

      <Route path="/app" element={<RequireAuth><WorkspaceLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/app/upload" replace />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="mypage" element={<MyPageRoute />} />
      </Route>

      {/* 임시 테스트 진입점. 배포 번들에는 라우트 자체가 없다 —
          검증이 끝나면 이 줄과 src/dev/BodyDiffTest.jsx를 함께 지운다. */}
      {import.meta.env.DEV && <Route path="/dev/body-diff" element={<BodyDiffTest />} />}

      {/* 없는 주소는 랜딩으로. replace라서 뒤로가기가 죽은 주소로 되돌아가지 않는다. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
