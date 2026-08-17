// 앱의 주소 지도. 화면 전환이 state였을 때는 이 표가 App.jsx의 if문 더미로 흩어져
// 있었고, 새로고침 한 번이면 전부 랜딩으로 돌아갔다.
//
// 화면 컴포넌트들은 그대로 둔다. onExit·onSwitchToLogin 같은 콜백 prop을 받는
// 순수한 화면으로 남기고, 여기 얇은 래퍼가 useNavigate로 그 콜백을 채워 넣는다.
// 화면이 라우터를 몰라야 나중에 어디에 갖다 붙여도 그대로 동작한다.
import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import LandingPage from '@/features/landing/LandingPage';
import HomeDashboard from '@/features/workspace/HomeDashboard';
import OnboardingFlow from '@/features/onboarding/OnboardingFlow';
import SignupPage from '@/features/auth/SignupPage';
import LoginPage from '@/features/auth/LoginPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import WorkspaceLayout from '@/layouts/WorkspaceLayout';
import UploadPage from '@/features/workspace/UploadPage';
import ResultReport from '@/features/workspace/ResultReport';
import MyPage from '@/features/workspace/MyPage';
import PapersPage from '@/features/workspace/PapersPage';
import { useAnalysis } from '@/features/workspace/analysisContext';
import { AnalysisProvider } from '@/features/workspace/AnalysisProvider';
import { SubmissionsProvider } from '@/features/workspace/SubmissionsProvider';
import { getAnalysis, listSubmissions } from '@/services/submissions';
import LegalPage from '@/features/legal/LegalPage';
import SharedReportPage from '@/features/share/SharedReportPage';
import BodyDiffTest from '@/dev/BodyDiffTest';
import ReportPreview from '@/dev/ReportPreview';
import TranslateTest from '@/dev/TranslateTest';
import { RequireAuth, RedirectIfAuthed } from '@/features/auth/guards';
import { useAuth } from '@/features/auth/authContext';
import { parseStep } from '@/features/onboarding/steps';
import { clearAnswers } from '@/features/onboarding/sessionState';
import { clearTokens } from '@/services/tokenStorage';

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
  const { signIn } = useAuth();
  return (
    <LoginPage
      onExit={() => navigate('/')}
      // 랜딩의 "시작하기"와 같은 문으로 보낸다 — 계정을 새로 만드는 길은 어디서
      // 눌러도 온보딩을 먼저 거쳐야 한다. 곧장 /signup으로 보내면 여기서 시작한
      // 사람만 온보딩 답변 없이(관심 분야·학회 없이) 가입하게 되어 온보딩이
      // "가입 전 필수 단계"가 아니라 "홈에서만 보이는 선택 단계"가 돼버린다.
      onSwitchToSignup={() => navigate('/onboarding')}
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

/**
 * 회원 탈퇴 직후. 라우터로 화면만 바꾸지 않고 페이지를 통째로 다시 연다.
 *
 * SPA 안에서 옮기려면 "세션을 비우는 것"과 "보호 구역을 벗어나는 것"의 순서를
 * 맞춰야 하는데, 그게 되지 않았다. navigate를 먼저 하고 flushSync로 커밋까지
 * 확정시켜도, 뒤이어 RequireAuth가 만들어 둔 <Navigate>의 effect가 늦게 돌면서
 * /login?next=/app/mypage로 덮어썼다(history 호출을 추적해 확인).
 *
 * 순서를 더 정교하게 맞추는 대신 하드 이동을 고른 이유는, 그게 이 상황에 맞는
 * 동작이기도 해서다 — 계정이 사라졌으면 메모리에 남은 것(진행 중이던 분석,
 * 사용자 정보, 라우터 히스토리)도 같이 버리는 게 맞다. 평생 한 번 하는 조작이라
 * 새로고침 한 번의 비용은 문제가 되지 않는다.
 *
 * onboarding 답변(sessionStorage)까지 지우는 이유는 같은 브라우저에서 다음 사람이
 * 가입할 때 남의 답변을 물려받지 않게 하기 위해서다.
 */
function leaveAfterAccountDeleted() {
  clearTokens();
  clearAnswers();
  window.location.replace('/');
}

function MyPageRoute() {
  const { user, setUser } = useAuth();
  return <MyPage user={user} onUserChange={setUser} onAccountDeleted={leaveAfterAccountDeleted} />;
}

// 결과 목록(/app/report)과 상세(/app/report/:paperId)를 같은 화면 컴포넌트
// (ResultReport)에 연결한다 — 열려있는 논문이 곧 주소라, 뒤로가기를 누르면
// 상세→목록→업로드 폼 순으로 그대로 되짚어 간다(예전엔 이 셋이 전부 /app/upload
// 하나의 내부 state였다). /app/upload 밑이 아니라 별도 경로인 이유는, 업로드
// 폼과 "그 결과 화면"은 성격이 다른데 같은 상위 경로에 있으면 active 판단·주소
// 구조 양쪽에서 계속 "둘이 같은 구역"으로 취급되기 때문이다. report가 없으면
// (새로고침·직접 주소 진입·리셋 직후) 업로드 폼으로 되돌린다 — 이 화면들은
// 방금 분석한 결과가 메모리에 있을 때만 뜻이 있다.
//
// "← 목록으로"는 navigate(-1)이다 — 상세는 항상 이 목록에서 눌러 들어온
// 것이므로, 실제 히스토리를 한 칸 되짚는 것과 "목록으로 가는 것"이 정확히
// 같다. 여기서 navigate(고정주소)를 쓰면(예전 방식) 뒤로가기 한 칸과 이
// 버튼이 서로 다른 걸 하게 되어, 번갈아 누르면 같은 자리를 왕복하며 못
// 빠져나가는 문제가 있었다(분석 이력↔상세 무한 왕복 버그).
//
// onReset("← 메인으로", 목록 화면에서만 보임)은 사이드바 말고도 이 화면을
// 벗어날 방법을 하나 더 준다. 여기도 PastAnalysisRoute의 onReset과 같은 이유로
// navigate(-1)이 아니라 고정 주소다 — 이 화면에 들어오는 길이 사이드바 항목
// 클릭 등 여러 갈래라, 되짚으면 어디로 갈지 예측할 수 없다. reset()을 안
// 부르는 이유는 그대로다: UploadPage가 phase==='done'이어도 새 폼을 보여주게
// 이미 돼 있고, 다음 분석이 끝나면 이 report는 어차피 덮어써진다.
function ReportRoute() {
  const navigate = useNavigate();
  const { report } = useAnalysis();
  const { paperId } = useParams();

  if (!report) return <Navigate to="/app/upload" replace />;

  return (
    <ResultReport
      report={report}
      paperId={paperId != null ? Number(paperId) : null}
      onOpenPaper={(id) => navigate(`/app/report/${id}`)}
      onClosePaper={() => navigate(-1)}
      onReset={() => navigate('/')}
      resetLabel="← 메인으로"
    />
  );
}

// "분석 이력"(PapersPage)에서 예전 분석을 다시 열 때 쓴다. ReportRoute와
// 달리 report를 AnalysisProvider가 아니라 그 submission_id로 서버에서 새로
// 받아온다 — 지금 진행 중인 분석(다른 논문)과 섞이면 안 되고, 애초에 지난
// 분석은 컨텍스트에 남아있지도 않기 때문이다(새로고침하면 사라짐).
//
// 논문 하나를 열었다 닫는 "← 목록으로"(onClosePaper)는 navigate(-1)이다 —
// 여는 길이 이 화면 안의 onOpenPaper 하나뿐이라(ReportRoute와 같은 이유) 되짚는
// 것과 목록으로 가는 것이 정확히 같다.
//
// 하지만 submission 전체를 떠나는 "← 분석 이력으로"(onReset)는 **고정 주소**로
// 보낸다, navigate(-1)이 아니라. 여기 들어오는 길은 하나가 아니다 — papers
// 목록을 거쳐서도, 홈 사이드바에서 항목을 바로 눌러서도 온다. 게다가 사이드바는
// 모든 /app/* 화면에 늘 떠 있어서 "목록 → 상세 → 목록 → 마이페이지 → 상세" 같은
// 조합이 얼마든지 쌓인다. 그 위에서 navigate(-1)을 쓰면 두 문제가 생긴다:
// (1) 어디로 갈지 예측할 수 없어 라벨이 약속을 못 지키고, (2) 쌓인 히스토리를
// 오갈 뿐인 쓸모없는 왕복이 된다. 고정 주소면 들어온 길과 무관하게 늘 같은 곳
// (분석 이력 목록)으로 나가므로 둘 다 사라진다.
function PastAnalysisRoute() {
  const navigate = useNavigate();
  const { submissionId, paperId } = useParams();
  const [state, setState] = useState({ status: 'loading', report: null, error: '', notFound: false });
  // submissionId가 바뀌었는데 이 컴포넌트가 재사용되는(언마운트 안 되는) 경우
  // 로딩 상태로 되돌린다 — effect 안에서 setState하면 안 되니 렌더 중에 비교한다.
  const [loadedFor, setLoadedFor] = useState(submissionId);
  if (submissionId !== loadedFor) {
    setLoadedFor(submissionId);
    setState({ status: 'loading', report: null, error: '', notFound: false });
  }

  useEffect(() => {
    let alive = true;
    getAnalysis(submissionId)
      .then((data) => {
        if (!alive) return;
        if (data.status !== 'done' || !data.report) {
          setState({ status: 'unavailable', report: null, error: '', notFound: false });
          return;
        }
        setState({ status: 'ready', report: data.report, error: '', notFound: false });
      })
      .catch((err) => {
        if (!alive) return;
        // 지운 논문의 상세 주소가 히스토리에 남아있으면(예: 목록에서 지운 뒤
        // 뒤로가기로 여기 되돌아오는 경우) 서버가 404를 준다 — 이건 오류가
        // 아니라 "더 이상 없음"이므로 메시지를 달리 준다.
        const notFound = err.status === 404;
        setState({
          status: 'error',
          report: null,
          error: notFound ? '' : (err.message || '불러오지 못했어요.'),
          notFound,
        });
      });
    return () => { alive = false; };
  }, [submissionId]);

  if (state.status === 'loading') {
    return <p className="wr-muted" style={{ marginTop: 24 }}>불러오는 중…</p>;
  }
  if (state.status === 'error' && state.notFound) {
    // 지워진 논문이다 — 오류 카드를 보여주고 사용자가 버튼을 눌러야 빠져나가게
    // 하는 대신, 곧바로 분석 이력 목록으로 넘긴다. replace라서 히스토리에 이
    // 죽은 주소가 새로 쌓이지 않는다 — 뒤로가기로 여기 도착했다면, 그 자리가
    // 목록으로 바뀌어치기 될 뿐이라 다음 뒤로가기는 이 주소를 다시 만나지 않는다.
    return <Navigate to="/app/papers" replace />;
  }
  if (state.status === 'error') {
    return (
      <div className="wr-card" style={{ marginTop: 24 }}>
        <div className="wr-card-title">불러오지 못했어요</div>
        <p className="wr-muted">{state.error}</p>
        <button type="button" className="onboard-back" onClick={() => navigate('/app/papers')}>
          ← 분석 이력으로
        </button>
      </div>
    );
  }
  if (state.status === 'unavailable') {
    return (
      <div className="wr-card" style={{ marginTop: 24 }}>
        <div className="wr-card-title">이 분석은 결과가 없어요</div>
        <p className="wr-muted">실패했거나 아직 진행 중인 분석이에요.</p>
        <button type="button" className="onboard-back" onClick={() => navigate('/app/papers')}>
          ← 분석 이력으로
        </button>
      </div>
    );
  }

  return (
    <ResultReport
      report={state.report}
      paperId={paperId != null ? Number(paperId) : null}
      onOpenPaper={(id) => navigate(`/app/papers/${submissionId}/${id}`)}
      onClosePaper={() => navigate(-1)}
      onReset={() => navigate('/app/papers')}
      resetLabel="← 분석 이력으로"
    />
  );
}

// /app의 기본 진입점(이슈 #26). 예전엔 무조건 업로드 폼으로 넘겼지만, 사용자는
// 두 부류다 — 처음 온 사람은 업로드 폼이 맞고, 이미 분석한 게 있는 재방문자는
// 그 결과("내 논문")부터 보고 싶다. 그래서 먼저 이력이 있는지 물어 갈림길을 만든다:
//   이력 있으면 → /app/papers, 없으면 → /app/upload.
//
// 헤더의 "새로운 논문 분석하기"는 이 분기를 타지 않고 늘 /app/upload로 간다
// (WorkspaceLayout.onGoUpload) — "기본 진입점"과 "새로 시작 버튼"의 목적지는 다르다.
//
// 목록 조회가 실패해도(네트워크·서버 오류) 업로드 폼으로 보낸다 — 이력이 없어도
// 늘 뜻이 있는 안전한 기본값이라서다. 분기 판단 때문에 진입 직후 짧은 로딩이 한 번
// 생기는데, 그 대신 재방문자가 매번 업로드 폼을 거쳐 "분석 이력"을 또 눌러야 하던
// 불필요한 단계가 사라진다.
function AppEntry() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    let alive = true;
    listSubmissions()
      .then((subs) => {
        if (alive) setTarget(Array.isArray(subs) && subs.length > 0 ? '/app/papers' : '/app/upload');
      })
      .catch(() => { if (alive) setTarget('/app/upload'); });
    return () => { alive = false; };
  }, []);

  if (target === null) {
    return (
      <div className="story-loading">
        <div className="story-spinner" />
        <p className="wr-muted">불러오는 중…</p>
      </div>
    );
  }
  return <Navigate to={target} replace />;
}

// 홈("/")은 로그인 여부 + "이 기기에서 홈을 처음 보는가"로 갈린다.
//   · 게스트/로그인 전         → 마케팅 랜딩(LandingPage)
//   · 로그인했지만 첫 방문(첫 로그인) → 마케팅 랜딩을 한 번 더 (환영 성격)
//   · 로그인 + 재방문           → 대시보드 홈(HomeDashboard)
// "첫 로그인"을 계정별로 아는 서버 필드가 없어, 기기 단위 플래그로 근사한다.
const HOME_VISITED_KEY = 'paper-trace:home_visited';
function hasVisitedHome() {
  try { return localStorage.getItem(HOME_VISITED_KEY) === '1'; } catch { return false; }
}
function markHomeVisited() {
  try { localStorage.setItem(HOME_VISITED_KEY, '1'); } catch { /* 저장 불가 — 다음에도 랜딩을 한 번 더 볼 뿐 */ }
}

function HomeRoute() {
  const { status } = useAuth();
  // 첫 방문 여부는 렌더 중 한 번만 고정한다 — 아래 effect가 곧바로 플래그를
  // 세우므로, 렌더 중에 다시 읽으면 첫 방문에도 대시보드로 튄다.
  const [firstVisit] = useState(() => !hasVisitedHome());
  useEffect(() => { if (status === 'authed') markHomeVisited(); }, [status]);

  if (status === 'loading') {
    return (
      <div className="story-loading">
        <div className="story-spinner" />
        <p className="wr-muted">불러오는 중…</p>
      </div>
    );
  }
  if (status !== 'authed' || firstVisit) return <LandingPage />;
  return <HomeDashboard />;
}

// 약관·개인정보처리방침의 단독 주소. 가드를 걸지 않는다 — 가입 전에도, 탈퇴한
// 뒤에도 읽을 수 있어야 하는 문서다.
//
// "돌아가기"가 navigate(-1)인 이유: 이 화면에는 들어오는 길이 여럿이다(가입 폼,
// 푸터, 공유받은 링크). 고정 주소로 보내면 그중 하나만 맞고 나머지는 엉뚱한
// 곳에 떨어진다. 히스토리가 없으면(링크로 바로 열었으면) 랜딩으로 보낸다.
function LegalRoute({ documentName }) {
  const navigate = useNavigate();
  const canGoBack = window.history.length > 1;
  return (
    <LegalPage
      documentName={documentName}
      onBack={() => (canGoBack ? navigate(-1) : navigate('/'))}
    />
  );
}

export default function AppRoutes() {
  // 분석 상태(AnalysisProvider)는 예전엔 WorkspaceLayout 안에만 있었다. 이제 홈
  // 대시보드 중앙에서도 UploadPage로 바로 분석을 시작할 수 있어야 하고, 분석이
  // 끝나면 analyze()가 /app/report로 옮겨 같은 report를 읽는다 — 홈과 /app가 같은
  // Provider를 공유해야 그 report가 넘어간다. 그래서 라우터 전체를 감싼다(게스트
  // 화면에서도 마운트되지만, 마운트만으로는 아무 요청도 하지 않아 무해하다).
  return (
    <SubmissionsProvider>
    <AnalysisProvider>
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      {/* 랜딩의 "시작하기"는 /onboarding으로 온다. replace라서 1단계에서 뒤로가면 랜딩이다. */}
      <Route path="/onboarding" element={<Navigate to="/onboarding/1" replace />} />
      <Route path="/onboarding/:step" element={<OnboardingRoute />} />

      <Route path="/signup" element={<RedirectIfAuthed><SignupRoute /></RedirectIfAuthed>} />
      <Route path="/login" element={<RedirectIfAuthed><LoginRoute /></RedirectIfAuthed>} />
      <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
      {/* 재설정은 가드를 걸지 않는다 — 로그인한 채로 메일 링크를 누를 수 있다. */}
      <Route path="/reset-password" element={<ResetPasswordRoute />} />

      <Route path="/terms" element={<LegalRoute documentName="terms" />} />
      <Route path="/privacy" element={<LegalRoute documentName="privacy" />} />

      {/* 공유 링크. **가드를 걸지 않는다** — 로그인 없이 열리는 것이 이 화면의
          존재 이유다(이슈 #30). 서버의 FRONTEND_BASE_URL이 만드는 주소가
          `{origin}/shared/{token}`이므로 이 경로는 백엔드와의 약속이다.
          바꾸려면 app/services/shares.py의 share_url()도 같이 바꿔야 하고,
          그 전에 나간 링크는 되돌릴 수 없다. */}
      <Route path="/shared/:token" element={<SharedReportPage />} />

      <Route path="/app" element={<RequireAuth><WorkspaceLayout /></RequireAuth>}>
        <Route index element={<AppEntry />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="report" element={<ReportRoute />} />
        <Route path="report/:paperId" element={<ReportRoute />} />
        <Route path="mypage" element={<MyPageRoute />} />
        <Route path="papers" element={<PapersPage />} />
        <Route path="papers/:submissionId" element={<PastAnalysisRoute />} />
        <Route path="papers/:submissionId/:paperId" element={<PastAnalysisRoute />} />
      </Route>

      {/* 임시 테스트 진입점. 배포 번들에는 라우트 자체가 없다 —
          검증이 끝나면 이 줄과 src/dev/BodyDiffTest.jsx를 함께 지운다. */}
      {import.meta.env.DEV && <Route path="/dev/body-diff" element={<BodyDiffTest />} />}
      {import.meta.env.DEV && <Route path="/dev/report" element={<ReportPreview />} />}
      {import.meta.env.DEV && <Route path="/dev/translate" element={<TranslateTest />} />}

      {/* 없는 주소는 랜딩으로. replace라서 뒤로가기가 죽은 주소로 되돌아가지 않는다. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AnalysisProvider>
    </SubmissionsProvider>
  );
}
