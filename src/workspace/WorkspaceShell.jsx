import BrandMark from '../components/BrandMark';

// 로그인 후 /app 화면들이 공유하는 상단바. 화면 간 이동(새 논문 분석/분석 이력/
// 마이페이지)은 홈(사이드바)이 맡으므로, 여기는 로고(→홈)·사용자·로그아웃만 둔다.
export default function WorkspaceShell({ user, onGoHome, onLogout, children }) {
  return (
    <div className="workspace-shell">
      <div className="workspace-topbar">
        {/* 로고는 홈(랜딩 첫 화면 /)으로 보낸다. */}
        <button type="button" className="onboard-brand" onClick={onGoHome}>
          <BrandMark size={26} />PAIR
        </button>
        <div className="workspace-topbar-right">
          {user?.nickname && <span className="workspace-user">{user.nickname} 님</span>}
          <button type="button" className="txt-link" onClick={onLogout}>로그아웃</button>
        </div>
      </div>
      <div className="workspace-body">{children}</div>
    </div>
  );
}
