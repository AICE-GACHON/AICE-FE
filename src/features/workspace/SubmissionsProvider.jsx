// 내가 올린 논문 목록을 워크스페이스 전체가 공유한다.
//
// 홈(ConsoleLayout)과 /app/papers(PapersPage)가 각자 listSubmissions()를 따로
// 불러 각자의 state에 담았던 게 문제였다 — 분석 이력 페이지에서 지워도 홈 사이드바는
// 자기 state를 모르니 그대로였고, 새로고침으로 다시 fetch해야만 맞아떨어졌다.
// AnalysisProvider가 분석 진행 상태를 라우터 전체 위에 둔 것과 같은 이유로, 이
// 목록도 AppRoutes 위에 올려 두 화면이 같은 배열을 본다.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listSubmissions, deleteSubmission } from '@/services/submissions';
import { SubmissionsContext } from './submissionsContext';

export function SubmissionsProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', items: [] });

  const refresh = useCallback(async () => {
    try {
      const data = await listSubmissions();
      setState({ status: 'ready', items: Array.isArray(data) ? data : [] });
    } catch {
      setState({ status: 'error', items: [] });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    listSubmissions()
      .then((data) => { if (alive) setState({ status: 'ready', items: Array.isArray(data) ? data : [] }); })
      .catch(() => { if (alive) setState({ status: 'error', items: [] }); });
    return () => { alive = false; };
  }, []);

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

  const value = useMemo(
    () => ({ ...state, refresh, removeSubmission, addSubmission }),
    [state, refresh, removeSubmission, addSubmission],
  );

  return <SubmissionsContext.Provider value={value}>{children}</SubmissionsContext.Provider>;
}
