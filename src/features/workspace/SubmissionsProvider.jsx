// 내가 올린 논문 목록을 워크스페이스 전체가 공유한다.
//
// 홈(ConsoleLayout)과 /app/papers(PapersPage)가 각자 listSubmissions()를 따로
// 불러 각자의 state에 담았던 게 문제였다 — 분석 이력 페이지에서 지워도 홈 사이드바는
// 자기 state를 모르니 그대로였고, 새로고침으로 다시 fetch해야만 맞아떨어졌다.
// AnalysisProvider가 분석 진행 상태를 라우터 전체 위에 둔 것과 같은 이유로, 이
// 목록도 AppRoutes 위에 올려 두 화면이 같은 배열을 본다.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listSubmissions, deleteSubmission } from '@/services/submissions';
import { useAuth } from '@/features/auth/authContext';
import { SubmissionsContext } from './submissionsContext';

// 게스트 화면이 들고 갈 빈 목록. 렌더마다 새 배열을 만들면 아래 useMemo가 매번
// 새 value를 뱉어 이 컨텍스트를 보는 화면이 전부 다시 그려진다.
const NO_ITEMS = [];

export function SubmissionsProvider({ children }) {
  const { status: authStatus, user } = useAuth();
  // 어느 계정의 목록인지 함께 들고 있는다 — 로그아웃 후 다른 계정으로 들어왔을 때,
  // 새 목록이 도착하기 전까지 앞사람 이력이 잠깐 비치는 것을 막는다.
  const userKey = user?.user_id || user?.email || null;
  const [state, setState] = useState({ status: 'loading', items: [], userKey: null });

  const refresh = useCallback(async () => {
    try {
      const data = await listSubmissions();
      setState({ status: 'ready', items: Array.isArray(data) ? data : [], userKey });
    } catch {
      setState({ status: 'error', items: [], userKey });
    }
  }, [userKey]);

  // **인증 상태에 묶는 것이 핵심이다.** 이 Provider는 라우터 전체(랜딩·로그인·가입
  // 포함)를 감싸므로, deps가 []이면 아직 토큰이 없는 게스트 화면에서 딱 한 번 fetch를
  // 시도하고 그 자리에서 실패한다(authFetch가 요청도 보내기 전에 "로그인이 필요해요"를
  // throw). 그 뒤 가입·로그인에 성공해도 SPA라 Provider가 다시 마운트되지 않아
  // status가 'error'에 갇혔고, 사이드바는 새로고침 전까지 "불러오지 못했어요."만 띄웠다
  // — 방금 가입한 사람이 처음 보는 화면이 에러였다.
  //
  // 로그인하지 않았으면 아예 부르지 않는다. 그 상태는 아래 value에서 빈 'ready'로
  // 내보낸다 — 서버에 물어보지도 않은 것을 'error'라고 부르면, 화면은 "못 불러왔다"와
  // "아직 없다"를 구분할 수 없다.
  useEffect(() => {
    if (authStatus !== 'authed') return;
    let alive = true;
    listSubmissions()
      .then((data) => {
        if (alive) setState({ status: 'ready', items: Array.isArray(data) ? data : [], userKey });
      })
      .catch(() => { if (alive) setState({ status: 'error', items: [], userKey }); });
    return () => { alive = false; };
  }, [authStatus, userKey]);

  // 삭제 API 호출과 목록 갱신을 한곳에 둔다 — 호출부(PapersPage 등)가 지운 뒤 이
  // 함수만 부르면, 그 결과가 이 목록을 보는 모든 화면(사이드바 포함)에 즉시 반영된다.
  const removeSubmission = useCallback(async (submissionId) => {
    await deleteSubmission(submissionId);
    setState((s) => ({ ...s, items: s.items.filter((it) => it.submission_id !== submissionId) }));
  }, []);

  // 새로 올린 초안을 목록 맨 앞에 끼워 넣는다 — 서버가 created_at 내림차순으로
  // 주므로 방금 올린 게 항상 맨 위다. AnalysisProvider가 업로드에 성공한 시점에
  // 부른다: 그때는 이미 서버에 행이 생겼으니(listSubmissions로 다시 불러도 나올
  // 값이니) 목록을 다시 fetch하는 대신 알고 있는 값을 바로 끼워 넣는 편이 낫다.
  // 같은 submission_id가 이미 있으면 건너뛴다 — StrictMode 이중 호출이나 재시도로
  // 두 번 불려도 목록에 같은 논문이 두 줄로 찍히지 않는다.
  const addSubmission = useCallback((submission) => {
    setState((s) => {
      if (s.items.some((it) => it.submission_id === submission.submission_id)) return s;
      return { ...s, items: [submission, ...s.items] };
    });
  }, []);

  // 밖으로 내보내는 상태는 state를 그대로 쓰지 않고 인증 상태로 한 번 거른다.
  // effect 안에서 setState로 같은 일을 하면 렌더가 한 번 더 돌고(react-hooks의
  // set-state-in-effect), 게스트일 때와 계정이 바뀐 직후에 앞 상태가 한 프레임
  // 비친다. 계산으로 두면 그 틈 자체가 없다.
  const value = useMemo(() => {
    const view =
      authStatus === 'authed'
        ? (state.userKey === userKey ? state : { status: 'loading', items: NO_ITEMS })
        : { status: authStatus === 'loading' ? 'loading' : 'ready', items: NO_ITEMS };
    return { status: view.status, items: view.items, refresh, removeSubmission, addSubmission };
  }, [authStatus, userKey, state, refresh, removeSubmission, addSubmission]);

  return <SubmissionsContext.Provider value={value}>{children}</SubmissionsContext.Provider>;
}
