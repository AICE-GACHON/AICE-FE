// 백엔드 연동 지점 — 논문 초안 업로드(JSON/PDF) + 분석 시작/폴링.
// AICE-BE 실제 스펙 기준 (app/routers/submission.py, app/routers/feedback.py, DEVELOPMENT.md §7):
//   POST /api/submissions               { title, abstract, content?, field? }        -> SubmissionResponse (201)
//   POST /api/submissions/pdf           multipart(title?, abstract?, field?, pdf)     -> SubmissionResponse (201)
//   POST /api/submissions/{id}/analysis -> 202, AnalysisStartResponse (status: pending)
//   GET  /api/submissions/{id}/analysis -> AnalysisResponse (status: pending|running|done|failed, report)
// 넷 다 인증 필요(Authorization: Bearer). report 스키마는 paper_assistant/schemas.py의 Report 그대로라
// http://127.0.0.1:8000/api/analyze(데모 서버)로 실측한 응답과 필드가 동일하다.
//
// PDF 업로드: title/abstract를 비워서 보내면 서버가 paper_assistant의 추출기로 채운다.
// 20MB 초과/PDF가 아닌 파일/추출 실패는 서버가 422로 거부한다(app/routers/submission.py).
import { authorizedFetch } from './auth';
import { MOCK_REPORT } from '../workspace/mockReport';

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

export async function getAnalysis(submissionId) {
  if (!BASE_URL) {
    const step = (mockProgress.get(submissionId) ?? 0) + 1;
    mockProgress.set(submissionId, step);
    if (step < 2) return { submission_id: submissionId, status: 'pending', report: null };
    if (step < 3) return { submission_id: submissionId, status: 'running', report: null };
    return { submission_id: submissionId, status: 'done', report: MOCK_REPORT, explanation_source: 'stub' };
  }
  return authorizedFetch(`/api/submissions/${submissionId}/analysis`);
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
