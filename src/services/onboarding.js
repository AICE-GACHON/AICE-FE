// 백엔드 연동 지점 — 회원가입 전 온보딩(3단계) 결과 저장.
// AICE-BE 실제 스펙 기준 (app/routers/onboarding.py, app/schemas/onboarding.py):
//   POST /api/onboarding { user_type, experience, fields, similarity_focus, recency_bias, venue }
//   -> 201, OnboardingResponse { onboarding_id, ... } (인증 불필요)
//
// 쿠키 세션이 아니라, 응답의 onboarding_id를 프론트가 들고 있다가 회원가입 요청
// (SignupRequest.onboarding_id)에 실어 보내야 그 시점에 계정과 연결된다 — 세션리스 구조.
// signup/login 등과 같은 IP rate limit(5/분)이 걸려 있어 실패해도(429 포함) 온보딩 자체를
// 막지 않고 그냥 온보딩 연결 없이 계속 진행한다 (OnboardingFlow.jsx에서 처리).
//
//   GET   /api/user/me/onboarding (인증 필요) -> OnboardingResponse | 404
//   PATCH /api/user/me/onboarding (인증 필요) -> OnboardingResponse (보낸 필드만 갱신, upsert)
import { authorizedFetch } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * @param {object} payload - OnboardingCreate와 동일한 snake_case 키(user_type, venue 등)
 * @returns {Promise<{onboarding_id: string, ...object}>}
 */
export async function saveOnboardingProfile(payload) {
  if (!BASE_URL) {
    console.info('[onboarding] VITE_API_BASE_URL 미설정 — 세션에만 저장하고 진행:', payload);
    return { onboarding_id: null, ...payload };
  }

  const res = await fetch(`${BASE_URL}/api/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.success === false) {
    throw new Error(body?.error?.message || `온보딩 저장 실패 (${res.status})`);
  }
  return body.data;
}

/**
 * 내 계정에 연결된 온보딩 답변을 가져온다.
 *
 * 온보딩을 건너뛰고 가입했거나 구글로 바로 가입한 계정은 행 자체가 없어서 서버가
 * 404를 준다. 이건 실패가 아니라 "아직 없음"이므로 null로 바꿔 돌려준다 — 호출부가
 * 빈 상태와 진짜 오류를 구분할 수 있어야 한다.
 *
 * @returns {Promise<object|null>} OnboardingResponse (snake_case) 또는 null
 */
export async function fetchMyOnboarding() {
  if (!BASE_URL) {
    console.info('[onboarding] VITE_API_BASE_URL 미설정 — 저장된 답변 없음으로 처리');
    return null;
  }
  try {
    return await authorizedFetch('/api/user/me/onboarding');
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

/**
 * 온보딩 답변을 고친다. **보낸 필드만 갱신된다** (서버가 exclude_unset으로 처리).
 *
 * 답변이 아예 없는 계정(위 fetchMyOnboarding이 null을 준 경우)이어도 404가 아니라
 * 새로 만들어진다 — upsert다. 온보딩은 가입 전에만 지나가는 흐름이라 "먼저
 * 만들고 오세요"가 성립하지 않기 때문이다.
 *
 * ⚠️ 리스트 항목(fields/venue)에 null을 보내면 **무시된다.**
 * 비우려는 의도라면 빈 배열 []을 보내야 한다 — 서버 쪽 컬럼이 not null이라
 * null과 "안 보냄"을 같이 취급한다.
 *
 * @param {object} payload - OnboardingCreate와 같은 snake_case 키. 고칠 것만 담는다.
 * @returns {Promise<object>} 갱신된 OnboardingResponse
 */
export async function updateMyOnboarding(payload) {
  if (!BASE_URL) {
    console.info('[onboarding] VITE_API_BASE_URL 미설정 — 수정 mock 처리:', payload);
    return { onboarding_id: null, ...payload };
  }
  return authorizedFetch('/api/user/me/onboarding', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
