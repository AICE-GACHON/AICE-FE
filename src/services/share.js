// 분석 결과의 공개 공유 링크 — AICE-BE의 이슈 #30 (app/routers/shared.py).
//
//   POST   /api/submissions/{id}/share  -> { token, url }   인증 필요, 소유자만
//   DELETE /api/submissions/{id}/share  -> 204              인증 필요, 소유자만
//   GET    /api/shared/{token}          -> SharedAnalysis   **인증 없음**
//
// 왜 이게 따로 필요한가: 결과 화면 주소(/app/papers/{id})는 로그인 경로라, 그 링크를
// 그대로 공유하면 받은 사람은 남의 계정으로 로그인해야만 열 수 있다 — 즉 못 연다.
// 서버가 추측 불가능한 토큰(secrets.token_urlsafe(32))을 발급하고, 그 토큰으로만
// 열리는 비로그인 경로를 따로 둔다.
//
// **url은 서버가 만들어 준다.** 여기서 조립하지 않는 이유는 같은 규칙이 두 곳에
// 생기면 한쪽만 바뀌었을 때 이미 나간 링크가 깨지기 때문이다. 서버는
// FRONTEND_BASE_URL로 `{origin}/shared/{token}`을 만든다 — 이 파일의 경로와
// routes/index.jsx의 /shared/:token이 그 약속의 우리 쪽 절반이다.
//
// SharedAnalysis는 **일부러 좁다** (title, abstract, field, report). 소유자
// 이메일·user_id·업로드한 PDF 원본·내부 식별자는 서버가 내보내지 않는다.
import { authorizedFetch } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 공유 링크를 발급한다. **이미 있으면 서버가 그것을 그대로 돌려준다**(멱등) —
 * 공유 버튼을 두 번 눌렀다고 먼저 보낸 링크가 죽지 않는다.
 *
 * 분석이 끝나지 않았으면 서버가 409를 준다. 호출부는 err.status로 갈라서
 * "분석이 끝난 뒤에 공유할 수 있어요"를 보여주면 된다.
 *
 * @param {string} submissionId
 * @returns {Promise<{token: string, url: string}>}
 */
export async function createShareLink(submissionId) {
  if (!BASE_URL) {
    const token = `mock-${submissionId}`;
    return { token, url: `${window.location.origin}/shared/${token}` };
  }
  return authorizedFetch(`/api/submissions/${submissionId}/share`, { method: 'POST' });
}

/**
 * 공유를 폐기한다. 그 뒤로 그 링크는 404다.
 *
 * 폐기할 공유가 없어도 204라서 던지지 않는다 — 폐기는 멱등하다. "이미 꺼져 있음"과
 * "방금 껐음"을 화면이 구분해 봐야 할 일이 같다.
 */
export async function revokeShareLink(submissionId) {
  if (!BASE_URL) return;
  await authorizedFetch(`/api/submissions/${submissionId}/share`, { method: 'DELETE' });
}

/**
 * 공유 토큰으로 분석 결과를 읽는다. **로그인하지 않은 사람이 부르는 유일한 조회다.**
 *
 * authorizedFetch를 쓰지 않는다 — 토큰이 없는 방문자가 부르는 경로이고,
 * authorizedFetch는 access_token이 없으면 요청 전에 "로그인이 필요해요"로 던진다.
 *
 * 없는 토큰·폐기된 토큰·결과 없는 초안이 **전부 404**다(서버가 사유를 구분해 주지
 * 않는다 — 구분하면 토큰을 찍어보는 쪽에 힌트가 된다). 그래서 화면도 하나의 문구로
 * 안내한다.
 *
 * @param {string} token
 * @returns {Promise<{title: string, abstract: string, field: string|null, report: object|null}>}
 */
export async function fetchSharedAnalysis(token) {
  if (!BASE_URL) {
    const { MOCK_REPORT } = await import('./mocks/mockReport');
    return {
      title: MOCK_REPORT.query_title,
      abstract: MOCK_REPORT.query_abstract,
      field: null,
      report: MOCK_REPORT,
    };
  }

  const res = await fetch(`${BASE_URL}/api/shared/${encodeURIComponent(token)}`);
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.success === false) {
    const err = new Error(
      body?.error?.message || `공유된 분석을 불러오지 못했어요 (${res.status})`,
    );
    err.status = res.status;
    throw err;
  }
  return body.data;
}
