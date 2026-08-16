// /app 아래 화면들의 공통 껍데기. 예전 Workspace.jsx가 하던 일에서 "지금 어느 화면인지"만
// 라우터에게 넘겼다 — page state 대신 주소가 답을 갖고 있다.
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TourOverlay from '@/features/workspace/TourOverlay';
import WorkspaceShell from './WorkspaceShell';
import { useAuth } from '@/features/auth/authContext';
import ConsentBanner from '@/features/legal/ConsentBanner';

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
  const { user, setUser } = useAuth();
  const [showTour, setShowTour] = useState(() => !hasSeenTour());

  const dismissTour = () => {
    try {
      localStorage.setItem(TOUR_KEY, '1');
    } catch {
      // localStorage 사용 불가 환경 — 다음에도 튜토리얼이 다시 뜰 뿐, 진행은 막지 않는다
    }
    setShowTour(false);
  };

  // 로그아웃 뒤 어디로 가는지는 여기서 안 정한다 — RequireAuth가 정한다.
  // 여기서 navigate('/')를 먼저 부르는 방식은 react-router v7에서 안 통했다
  // (guards.jsx RequireAuth 주석에 실측과 함께 적어뒀다). 그래서 레일의 로그아웃
  // 버튼은 signOut만 부르면 되고, 이 컴포넌트가 넘겨줄 것은 아무것도 없다.

  // 분석 상태(AnalysisProvider)는 이제 라우터 전체(AppRoutes)가 들고 있다 —
  // 홈 대시보드 중앙에서도 분석을 시작할 수 있어야 해서 한 단계 위로 올렸다.
  return (
    <>
      {showTour && <TourOverlay onDone={dismissTour} />}
      {/* user·onGoHome·onLogout을 더 넘기지 않는다 — 레일(ConsoleLayout)이
          useAuth로 직접 읽고, 로고는 <Link to="/">라 이동도 스스로 한다. */}
      <WorkspaceShell>
        {/* === false로 비교한다. mock 모드(VITE_API_BASE_URL 미설정)에서는 user가
            null이라, truthy 검사로 두면 백엔드 없이 화면만 보는 개발 중에 이
            띠가 항상 떠 있게 된다. */}
        {user?.consent_up_to_date === false && <ConsentBanner onAgreed={setUser} />}
        <Outlet />
      </WorkspaceShell>
    </>
  );
}
