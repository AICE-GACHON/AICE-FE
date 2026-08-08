// 백엔드 연동 지점 — 코퍼스 논문의 심사 서사(story).
// AICE-BE 실제 스펙 기준 (app/routers/corpus.py, docs/FRONTEND_심사서사_API.md):
//   GET /api/papers/{paper_id}/story?refresh=bool -> ApiResponse[PaperStory]
// 인증 불필요(공개 코퍼스 데이터). 첫 호출은 OpenReview를 실시간으로 타서 수 초 걸리고
// (LLM이 켜져 있으면 더 걸림), 두 번째부터는 서버 캐시라 빠르다 — 그래서 목록을 그릴 때
// 미리 부르지 않고, 사용자가 논문을 열었을 때(PaperStoryPanel 마운트 시)만 호출한다.
import { MOCK_STORY } from '../workspace/story/mockStory';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * @param {number} paperId
 * @param {{refresh?: boolean}} [opts] - refresh:true면 캐시를 무시하고 다시 만든다 (느림)
 * @returns {Promise<object>} PaperStory
 */
export async function getPaperStory(paperId, { refresh = false } = {}) {
  if (!BASE_URL) {
    console.info('[papers] VITE_API_BASE_URL 미설정 — 심사 서사 mock 처리:', paperId);
    // 개발 중 로딩 상태를 눈으로 확인할 수 있게 약간의 지연을 흉내낸다.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { ...MOCK_STORY, paper_id: paperId };
  }

  const url = new URL(`${BASE_URL}/api/papers/${paperId}/story`);
  if (refresh) url.searchParams.set('refresh', '1');

  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.success === false) {
    throw new Error(body?.error?.message || `심사 서사를 불러오지 못했어요 (${res.status})`);
  }
  return body.data;
}
