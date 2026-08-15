import BrandMark from '../components/BrandMark';

// 로그인 후 화면(새로운 논문 분석하기 / 분석 이력 / 마이페이지)이 공유하는 상단바.
// 화면이 갈라지면서 상단바를 각자 들고 있으면 한쪽만 바뀌어 어긋나기 쉬워서 여기로 모았다.
//
// 네 항목을 항상 고정으로 보여준다 — 예전엔 지금 있는 화면의 링크를 숨겼는데,
// /app/upload/report처럼 결과 화면이 업로드 폼 하위 경로였을 때는 그 판단이
// 상위 폴더 기준이라 "새로운 논문 분석하기" 링크까지 같이 숨어버리는 문제가
// 있었다(결과 화면은 지금 별도 경로 /app/report로 분리했다 — routes.jsx 참고).
// 항상 다 보여주고, 지금 있는 화면은 색으로만 표시한다(클릭해도 제자리라
// 이동 자체를 안 시켜서 히스토리에 같은 주소가 중복으로 쌓이지도 않는다).
function NavLink({ label, section, active, onClick }) {
  const isHere = active === section;
  return (
    <button
      type="button"
      className={isHere ? 'txt-link txt-link-active' : 'txt-link'}
      onClick={isHere ? undefined : onClick}
    >
      {label}
    </button>
  );
}

export default function WorkspaceShell({ user, active, onGoHome, onGoUpload, onGoPapers, onGoMyPage, onLogout, children }) {
  return (
    <div className="workspace-shell">
      <div className="workspace-topbar">
        {/* 로고는 홈(랜딩 첫 화면 /)으로 보낸다. 상단바의 "새로운 논문 분석하기"가
            업로드 폼(/app/upload)을 따로 맡으므로 목적지가 겹치지 않는다. */}
        <button type="button" className="onboard-brand" onClick={onGoHome}>
          <BrandMark size={26} />PAIR
        </button>
        <div className="workspace-topbar-right">
          {user?.nickname && <span className="workspace-user">{user.nickname} 님</span>}
          <NavLink label="새로운 논문 분석하기" section="upload" active={active} onClick={onGoUpload} />
          <NavLink label="분석 이력" section="papers" active={active} onClick={onGoPapers} />
          <NavLink label="마이페이지" section="mypage" active={active} onClick={onGoMyPage} />
          <button type="button" className="txt-link" onClick={onLogout}>로그아웃</button>
        </div>
      </div>
      <div className="workspace-body">{children}</div>
    </div>
  );
}
