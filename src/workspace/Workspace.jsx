import { useState } from 'react';
import TourOverlay from './TourOverlay';
import UploadPage from './UploadPage';

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

export default function Workspace({ user, onLogout }) {
  const [showTour, setShowTour] = useState(() => !hasSeenTour());

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
      <UploadPage user={user} onLogout={onLogout} />
    </>
  );
}
