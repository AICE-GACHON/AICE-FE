// 라우트 가드. 로그인 여부로 화면 접근을 가르는 곳은 여기 하나뿐이어야 한다 —
// 각 화면이 알아서 판단하면 새로 만든 화면 하나가 조용히 무방비로 열린다.
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from './authContext';
import { safeNextPath } from './nextPath';

// status === 'loading'은 "게스트"가 아니라 "아직 모름"이다. 이 구간에 판단을
// 내려버리면 로그인한 사람이 새로고침할 때마다 로그인 화면이 한 번 번쩍인다.
function SessionLoading() {
  return (
    <div className="story-loading">
      <div className="story-spinner" />
      <p className="wr-muted">불러오는 중…</p>
    </div>
  );
}

/** 로그인해야 볼 수 있는 화면. 게스트는 로그인으로 보내되 가려던 곳을 기억한다. */
export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'guest') {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return children;
}

/**
 * 로그인·회원가입 화면. 이미 로그인한 사람이 열면 안으로 들여보낸다.
 * 비밀번호 재설정은 여기 해당하지 않는다 — 로그인한 채로 메일 링크를 누를 수 있다.
 *
 * **로그인 성공 뒤의 이동도 이 가드가 한다.** 화면 쪽에서 따로 navigate하면
 * signIn으로 authed가 되는 순간 이 가드가 먼저 발동해 ?next=를 무시한 채
 * 기본 경로로 보내버린다 — 어느 쪽이 이기든 같은 곳으로 가게, 판단을 한 군데 모은다.
 */
export function RedirectIfAuthed({ children }) {
  const { status } = useAuth();
  const [params] = useSearchParams();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'authed') return <Navigate to={safeNextPath(params.get('next'))} replace />;
  return children;
}
