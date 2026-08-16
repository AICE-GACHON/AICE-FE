import { useLocation, useMatch } from 'react-router-dom';
import ConsoleLayout from './ConsoleLayout';

// 로그인 후 /app 화면들이 공유하는 껍데기 — 홈과 **같은** 콘솔 레이아웃이다.
//
// 예전에는 여기에 딥그린 상단바(로고·사용자·로그아웃)가 있고 레일은 홈에만
// 있었다. 레일을 /app까지 올리고 나니 상단바가 하는 말이 전부 레일에 이미
// 있어서(로고→홈, 이름→마이페이지, 로그아웃) 통째로 걷어냈다. 남은 것은
// 상단바가 유일하게 갖고 있던 정보인 "지금 어느 화면인가" 하나다.
//
// 그 한 단어는 작업 영역 맨 위 띠에 놓는다. 콘솔 성격의 화면에서는 이게
// 브레드크럼보다 값싸고 정확하다 — 경로가 얕아서(최대 두 칸) 계층을 그릴 게
// 없고, 필요한 정보는 "여기가 리포트냐 이력이냐"뿐이다.
// /app/upload는 일부러 빠져 있다 — 그 화면은 자기 상태 띠(ConsoleStrip)를
// 직접 그리고 거기에 이미 "NEW ANALYSIS"가 적혀 있다. 같은 자리에 띠가 두 겹
// 쌓이느니 화면에게 맡긴다.
const CONTEXT_LABELS = [
  ['/app/mypage', 'ACCOUNT'],
  ['/app/papers', 'HISTORY'],
  ['/app/report', 'REPORT'],
];

function useContextLabel() {
  const { pathname } = useLocation();
  // 상세 화면은 목록과 다른 라벨을 쓴다 — 표를 훑는 자리와 논문 한 편을 읽는
  // 자리는 하는 일이 달라서, 같은 이름표를 달면 어디로 돌아가는지가 흐려진다.
  const reportDetail = useMatch('/app/report/:paperId');
  const pastDetail = useMatch('/app/papers/:submissionId/:paperId');
  if (reportDetail || pastDetail) return 'PAPER DETAIL';
  const hit = CONTEXT_LABELS.find(([prefix]) => pathname.startsWith(prefix));
  return hit ? hit[1] : null;
}

export default function WorkspaceShell({ children }) {
  const contextLabel = useContextLabel();

  return (
    <ConsoleLayout>
      {contextLabel && (
        <div className="ws-strip">
          <span className="ws-strip-label">{contextLabel}</span>
        </div>
      )}
      <div className="workspace-body">{children}</div>
    </ConsoleLayout>
  );
}
