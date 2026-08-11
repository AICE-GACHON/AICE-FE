import { useState } from 'react';
import TourOverlay from './TourOverlay';
import UploadPage from './UploadPage';
import MyPage from './MyPage';
import WorkspaceShell from './WorkspaceShell';

// 최초 시작인지는 기기(브라우저) 단위로 판단한다 — 백엔드에 계정별 "튜토리얼을 봤는지" 필드가
// 없어서다(AICE-BE API 목록에 없음). 서버에 남기고 싶다면 별도 API 추가가 필요하다(하단 안내 참고).
const TOUR_KEY = 'paper-trace:tour_seen';

const hasSeenTour = () => {
  try {
    return Boolean(localStorage.getItem(TOUR_KEY));
  } catch {
    return true; // localStorage 사용 불가 환경에서는 매번 뜨지 않도록 안전하게 "봤다"로 처리
  }
};

export default function Workspace({ user, onUserChange, onLogout, onAccountDeleted }) {
  const [showTour, setShowTour] = useState(() => !hasSeenTour());
  const [page, setPage] = useState('upload'); // 'upload' | 'mypage'

  const dismissTour = () => {
    try {
      localStorage.setItem(TOUR_KEY, '1');
    } catch {
      // localStorage 사용 불가 환경 — 다음에도 튜토리얼이 다시 뜰 뿐, 진행은 막지 않는다
    }
    setShowTour(false);
  };

  return (
    <>
      {showTour && <TourOverlay onDone={dismissTour} />}
      <WorkspaceShell
        user={user}
        active={page}
        onGoUpload={() => setPage('upload')}
        onGoMyPage={() => setPage('mypage')}
        onLogout={onLogout}
      >
        {/* 업로드 화면은 분석 진행 상태(phase)를 들고 있어서, 내 정보를 잠깐
            들렀다 와도 날아가면 안 된다 — 언마운트하지 않고 감춘다. */}
        <div hidden={page !== 'upload'}><UploadPage /></div>
        {page === 'mypage' && (
          <MyPage user={user} onUserChange={onUserChange} onAccountDeleted={onAccountDeleted} />
        )}
      </WorkspaceShell>
    </>
  );
}
