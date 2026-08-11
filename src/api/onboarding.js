// 백엔드 연동 지점 — 회원가입 전 온보딩(3단계) 결과 저장.
// AICE-BE 실제 스펙 기준 (app/routers/onboarding.py, app/schemas/onboarding.py):
//   POST /api/onboarding { user_type, experience, purposes, fields, stage, venue, result_order }
//   -> 201, OnboardingResponse { onboarding_id, ... } (인증 불필요)
//
// 쿠키 세션이 아니라, 응답의 onboarding_id를 프론트가 들고 있다가 회원가입 요청
// (SignupRequest.onboarding_id)에 실어 보내야 그 시점에 계정과 연결된다 — 세션리스 구조.
// signup/login 등과 같은 IP rate limit(5/분)이 걸려 있어 실패해도(429 포함) 온보딩 자체를
// 막지 않고 그냥 온보딩 연결 없이 계속 진행한다 (OnboardingFlow.jsx에서 처리).
//
//   GET /api/user/me/onboarding (인증 필요) -> OnboardingResponse | 404
//
// 수정 API는 아직 없다. 백엔드에 PATCH /api/user/me/onboarding(upsert)를 요청해 둔
// 상태라, 지금 마이페이지는 조회만 한다.
import { authorizedFetch } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * @param {object} payload - OnboardingCreate와 동일한 snake_case 키(user_type, result_order 등)
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
