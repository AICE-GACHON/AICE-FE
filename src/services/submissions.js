// 백엔드 연동 지점 — 논문 초안 업로드(JSON/PDF) + 분석 시작/폴링.
// AICE-BE 실제 스펙 기준 (app/routers/submission.py, app/routers/feedback.py, DEVELOPMENT.md §7):
//   POST /api/submissions               { title, abstract, content?, field? }        -> SubmissionResponse (201)
//   POST /api/submissions/pdf           multipart(title?, abstract?, field?, pdf)     -> SubmissionResponse (201)
//   POST /api/submissions/{id}/analysis -> 202, AnalysisStartResponse (status: pending)
//   GET  /api/submissions/{id}/analysis -> AnalysisResponse (status: pending|running|done|failed, report)
//   GET  /api/submissions               -> SubmissionSummary[] (submission_id, title, field, created_at — 초록 없음)
// 다섯 다 인증 필요(Authorization: Bearer). report 스키마는 paper_assistant/schemas.py의 Report 그대로라
// http://127.0.0.1:8000/api/analyze(데모 서버)로 실측한 응답과 필드가 동일하다.
//
// selected_papers[]의 `revision_count: int | null` — 결과 표의 "본문 수정" 열이 쓴다.
// 저자가 **본문 PDF를 교체한 횟수**다. 리비전 총 개수가 아니다 — 제목·초록만 고친
// edit은 안 센다(AICE-BE query/revisions.py의 count_body_revisions).
// **null과 0은 다른 값이다**: null은 "볼 수 없다"(2023년 이전 학회는 수정 이력이
// 공개되지 않는다 — ICLR 2023 이하·NeurIPS 2022 이하가 여기 해당), 0은 "확인해 보니
// 본문을 안 고쳤다". 화면도 "—"와 "없음"으로 다르게 그린다.
// 목록에서 body-diff를 논문마다 부르지 않는 이유는 papers.js 머리 주석 참고(첫 조회
// 수 초) — 백엔드가 분석 파이프라인 안에서 미리 세어 report에 실어 보낸다.
//
// PDF 업로드: title/abstract를 비워서 보내면 서버가 paper_assistant의 추출기로 채운다.
// 20MB 초과/PDF가 아닌 파일/추출 실패는 서버가 422로 거부한다(app/routers/submission.py).
import { authorizedFetch } from './auth';
import { MOCK_REPORT } from './mocks/mockReport';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// mock 모드에서 submission_id별 폴링 횟수를 기억해 pending → running → done을 흉내낸다.
const mockProgress = new Map();

/**
 * PDF로 초안을 올린다. title/abstract는 비워 보내도 되고(서버가 PDF에서 추출),
 * 사용자가 직접 입력했으면 그 값을 우선한다.
 * @param {{file: File, title?: string, abstract?: string, field?: string|null}} payload
 */
export async function createSubmissionFromPdf({ file, title = '', abstract = '', field = null }) {
  if (!BASE_URL) {
    console.info('[submissions] VITE_API_BASE_URL 미설정 — PDF 업로드 mock 처리:', file.name);
    return {
      submission_id: `mock-pdf-${Date.now()}`,
      title: title || file.name.replace(/\.pdf$/i, ''),
      abstract: abstract || '(mock) PDF에서 제목/초록을 추출했다고 가정한 값입니다.',
      content: null,
      field,
      // 15페이지 초과 경고 흐름도 mock으로 밟아볼 수 있게 둔다 (16으로 바꾸면 경고).
      page_count: 12,
    };
  }

  const form = new FormData();
  form.append('pdf', file);
  if (title) form.append('title', title);
  if (abstract) form.append('abstract', abstract);
  if (field) form.append('field', field);

  return authorizedFetch('/api/submissions/pdf', { method: 'POST', body: form });
}

export async function startAnalysis(submissionId) {
  if (!BASE_URL) {
    mockProgress.set(submissionId, 0);
    return { prediction_id: `mock-pred-${submissionId}`, submission_id: submissionId, status: 'pending' };
  }
  return authorizedFetch(`/api/submissions/${submissionId}/analysis`, { method: 'POST' });
}

// mock 모드에서 폴링 횟수마다 돌려줄 진행 이벤트. 실제 서버가 내보내는 것과 같은
// 모양이라(paper_assistant.schemas.ProgressEvent) 백엔드 없이도 단계 화면을
// 그대로 확인할 수 있다. 한 번에 여러 건이 늘어나는 것도 진짜와 같다 — 폴링보다
// 짧게 끝난 단계는 다음 응답에 몰아서 실려 온다.
const MOCK_EVENT = (step, done, label, detail = null) => ({
  step, done, label, detail, at: new Date().toISOString(),
});

// 준비(prepare) 단계를 일부러 한 틱 통째로 붙잡아 둔다 — 실제 서버에서 이 구간이
// SPECTER2 로드라 30~60초씩 걸리고, 그동안 "모델을 불러오느라 시간이 걸려요"가
// 화면에 떠 있는 유일한 설명이기 때문이다. 여기서 시작·끝을 한 틱에 몰아 보내면
// 그 문구가 mock에서는 한 번도 보이지 않아, 정작 가장 오래 보일 화면을 못 만든다.
const MOCK_PROGRESS_TICKS = [
  [],
  [MOCK_EVENT('prepare', false, '분석을 준비하고 있어요', '처음 한 번은 모델을 불러오느라 시간이 걸려요')],
  [MOCK_EVENT('prepare', true, '준비를 마쳤어요'),
   MOCK_EVENT('retrieval', false, '비슷한 논문을 찾고 있어요')],
  [MOCK_EVENT('retrieval', true, '후보 50편을 찾았어요'),
   MOCK_EVENT('rerank', false, '이 중에서 정말 비슷한 논문을 고르고 있어요')],
  [MOCK_EVENT('rerank', true, '본문을 대조해 5편을 골랐어요'),
   MOCK_EVENT('review_fetch', false, '고른 논문들이 받은 리뷰를 모으고 있어요')],
  [MOCK_EVENT('review_fetch', true, '논문 5편의 리뷰 22건을 모았어요',
              MOCK_REPORT.selected_papers?.[0]?.title ?? null),
   MOCK_EVENT('synthesis', false, '모은 리뷰를 정리하고 있어요'),
   MOCK_EVENT('synthesis', true, '정리를 마쳤어요')],
];

export async function getAnalysis(submissionId) {
  if (!BASE_URL) {
    const step = (mockProgress.get(submissionId) ?? 0) + 1;
    mockProgress.set(submissionId, step);
    // 서버와 마찬가지로 **지금까지의 전체 목록**을 매번 돌려준다.
    const progress = MOCK_PROGRESS_TICKS.slice(0, step).flat();
    if (step < 2) return { submission_id: submissionId, status: 'pending', progress, report: null };
    if (step < MOCK_PROGRESS_TICKS.length) {
      return { submission_id: submissionId, status: 'running', progress, report: null };
    }
    return { submission_id: submissionId, status: 'done', progress, report: MOCK_REPORT,
             explanation_source: 'stub' };
  }
  return authorizedFetch(`/api/submissions/${submissionId}/analysis`);
}

/** 내가 올린 논문 목록 — "내 논문" 화면용. 초록·리포트는 안 실려 있어 가볍다. */
export async function listSubmissions() {
  if (!BASE_URL) {
    console.info('[submissions] VITE_API_BASE_URL 미설정 — 내 논문 목록 mock 처리(빈 목록)');
    return [];
  }
  return authorizedFetch('/api/submissions');
}

/** 논문 초안 + 그에 딸린 분석 결과를 함께 지운다 (서버가 FK CASCADE로 처리). */
export async function deleteSubmission(submissionId) {
  if (!BASE_URL) return;
  await authorizedFetch(`/api/submissions/${submissionId}`, { method: 'DELETE' });
}

/**
 * status가 done/failed가 될 때까지 폴링한다. onTick으로 pending/running 중간 상태를 알려준다.
 *
 * signal은 이 루프를 멈출 유일한 수단이다. 끝 조건이 서버 응답뿐이라, 결과를 받을
 * 화면이 사라진 뒤에도(워크스페이스를 떠남) 3초마다 계속 서버를 두드린다.
 *
 * @param {{intervalMs?: number, onTick?: (data: object) => void, signal?: AbortSignal}} [options]
 */
export async function pollAnalysis(submissionId, { intervalMs = 3000, onTick, signal } = {}) {
  for (;;) {
    signal?.throwIfAborted();
    const data = await getAnalysis(submissionId);
    onTick?.(data);
    if (data.status === 'done' || data.status === 'failed') return data;
    // 대기 중에도 끊길 수 있어야 한다 — 안 그러면 멈추라고 한 뒤에도 마지막 한 번을 더 기다린다.
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, intervalMs);
      signal?.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
    });
  }
}
