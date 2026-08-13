import BrandMark from '../components/BrandMark';

// 로그인 후 화면(논문 분석 / 내 정보)이 공유하는 상단바. 페이지가 둘이 되면서
// 상단바를 각자 들고 있으면 한쪽만 바뀌어 어긋나기 쉬워서 여기로 모았다.
export default function WorkspaceShell({ user, active, onGoUpload, onGoMyPage, onLogout, children }) {
  const onMyPage = active === 'mypage';
  return (
    <div className="workspace-shell">
      <div className="workspace-topbar">
        <button type="button" className="onboard-brand" onClick={onGoUpload}>
          <BrandMark size={26} />PAIR
        </button>
        <div className="workspace-topbar-right">
          {user?.nickname && <span className="workspace-user">{user.nickname} 님</span>}
          <button
            type="button"
            className="txt-link"
            onClick={onMyPage ? onGoUpload : onGoMyPage}
          >
            {onMyPage ? '논문 분석' : '내 정보'}
          </button>
          <button type="button" className="txt-link" onClick={onLogout}>로그아웃</button>
        </div>
      </div>
      <div className="workspace-body">{children}</div>
    </div>
  );
}
