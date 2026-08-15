// /app 아래 화면들의 공통 껍데기. 예전 Workspace.jsx가 하던 일에서 "지금 어느 화면인지"만
// 라우터에게 넘겼다 — page state 대신 주소가 답을 갖고 있다.
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import TourOverlay from './TourOverlay';
import WorkspaceShell from './WorkspaceShell';
import { AnalysisProvider } from './AnalysisProvider';
import { useAuth } from '../auth/authContext';
import ConsentBanner from '../legal/ConsentBanner';

// 최초 시작인지는 기기(브라우저) 단위로 판단한다 — 백엔드에 계정별 "튜토리얼을 봤는지" 필드가
// 없어서다(AICE-BE API 목록에 없음). 서버에 남기고 싶다면 별도 API 추가가 필요하다.
const TOUR_KEY = 'paper-trace:tour_seen';

const hasSeenTour = () => {
  try {
    return Boolean(localStorage.getItem(TOUR_KEY));
  } catch {
    return true; // localStorage 사용 불가 환경에서는 매번 뜨지 않도록 안전하게 "봤다"로 처리
  }
};

export default function WorkspaceLayout() {
  const { user, signOut, setUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showTour, setShowTour] = useState(() => !hasSeenTour());

  // 상단바 강조는 주소에서 읽는다. /app은 곧바로 /app/upload로 넘어가므로
  // 그 찰나에도 어긋나 보이지 않는다.
  //
  // /app/upload로 시작하지 않으면(예: /app/report) null이다 — 예전엔 여기가
  // 무조건 'upload'로 떨어져서, 결과 화면(/app/report)에서 헤더의 "새로운
  // 논문 분석하기"가 "지금 있는 페이지"로 오인되어 클릭이 막혔다(WorkspaceShell의
  // NavLink는 active===section이면 onClick을 아예 안 붙인다) — 정작 그 버튼을
  // 눌러서 업로드 폼으로 가고 싶었던 것인데 안 눌린 것이다. /app/report는 이제
  // upload도 papers도 mypage도 아닌, 넷 중 아무것도 강조되지 않는 상태로 둔다.
  const active = pathname.startsWith('/app/mypage')
    ? 'mypage'
    : pathname.startsWith('/app/papers')
      ? 'papers'
      : pathname.startsWith('/app/upload') ? 'upload' : null;

  const dismissTour = () => {
    try {
      localStorage.setItem(TOUR_KEY, '1');
    } catch {
      // localStorage 사용 불가 환경 — 다음에도 튜토리얼이 다시 뜰 뿐, 진행은 막지 않는다
    }
    setShowTour(false);
  };

  // 순서가 중요하다. signOut을 먼저 하면 status가 guest로 바뀌는 순간 이 화면을
  // 감싼 RequireAuth가 먼저 발동해서 로그인 화면으로 보내버린다 — 로그아웃했는데
  // 랜딩이 아니라 로그인 폼 앞에 서게 된다. 보호 구역을 먼저 벗어나면 가드가
  // 판단할 일 자체가 없어진다.
  //
  // replace인 이유는 뒤로가기로 /app에 되돌아갔다가 다시 튕겨나오는 왕복을 막기 위해서다.
  const handleLogout = async () => {
    navigate('/', { replace: true });
    await signOut();
  };

  // AnalysisProvider가 /app 화면들보다 위에 있어야 한다. 업로드 화면 안에 두면
  // 화면이 언마운트될 때 분석 상태가 같이 사라진다 — 그걸 막으려고 올린 것이다.
  // 반대로 이 레이아웃을 벗어나면(로그아웃, 랜딩으로 이동) 같이 사라지는 게 맞다.
  return (
    <AnalysisProvider>
      {showTour && <TourOverlay onDone={dismissTour} />}
      <WorkspaceShell
        user={user}
        active={active}
        onGoUpload={() => navigate('/app/upload')}
        onGoPapers={() => navigate('/app/papers')}
        onGoMyPage={() => navigate('/app/mypage')}
        onLogout={handleLogout}
      >
        {/* === false로 비교한다. mock 모드(VITE_API_BASE_URL 미설정)에서는 user가
            null이라, truthy 검사로 두면 백엔드 없이 화면만 보는 개발 중에 이
            띠가 항상 떠 있게 된다. */}
        {user?.consent_up_to_date === false && <ConsentBanner onAgreed={setUser} />}
        <Outlet />
      </WorkspaceShell>
    </AnalysisProvider>
  );
}
