// 백엔드 연동 지점 — 회원가입/로그인/구글 로그인/토큰 재발급/로그아웃.
// AICE-BE 실제 스펙 기준 (app/routers/auth.py, app/schemas/auth.py, DEVELOPMENT.md §7):
//   POST /api/auth/signup  { email, password, nickname, openreview_id, onboarding_id? } -> UserResponse (201, 토큰 없음)
//   POST /api/auth/login   { email, password }               -> { access_token, refresh_token, token_type }
//   POST /api/auth/google  { id_token, openreview_id? }       -> { access_token, refresh_token, token_type }
//   POST /api/auth/refresh { refresh_token }                 -> { access_token, refresh_token, token_type } (회전)
//   POST /api/auth/logout  (인증 필요)                        -> 서버가 token_version을 올려 이전 refresh_token을 전부 무효화
//   GET  /api/user/me      (인증 필요)                        -> UserResponse
// 모든 응답은 { success, data, error: {code, message} | null } 공통 포맷(ApiResponse[T])으로 온다.
// 인증 없는 5개 엔드포인트(signup/login/google/refresh/onboarding)에는 IP 기준 rate limit이
// 걸려 있어 너무 자주 호출하면 429 + "요청이 너무 많습니다..." 메시지가 온다 — 그대로 노출하면 됨.
import { saveTokens, loadAccessToken, loadRefreshToken, clearTokens } from './tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// mock 모드 전용 — 백엔드 없이 signup → login을 이어서 테스트할 때 닉네임을 기억해두기 위함
const mockNicknameByEmail = new Map();

async function unwrap(res) {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.success === false) {
    throw new Error(body?.error?.message || `요청에 실패했어요 (${res.status})`);
  }
  return body.data;
}

/** @param {{email: string, password: string, nickname: string, openreviewId: string, onboardingId?: string|null}} payload */
export async function signup({ email, password, nickname, openreviewId, onboardingId }) {
  if (!BASE_URL) {
    console.info('[auth] VITE_API_BASE_URL 미설정 — 회원가입 mock 성공 처리:', { email, nickname, openreviewId, onboardingId });
    mockNicknameByEmail.set(email, nickname);
    return { user_id: 'mock-user', email, nickname, openreview_id: openreviewId, google_linked: false };
  }

  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      nickname,
      openreview_id: openreviewId,
      ...(onboardingId ? { onboarding_id: onboardingId } : {}),
    }),
  });
  return unwrap(res); // UserResponse — 자동 로그인은 안 되므로 뒤이어 login()을 호출해야 함
}

/** @param {{email: string, password: string}} payload */
export async function login({ email, password }) {
  if (!BASE_URL) {
    console.info('[auth] VITE_API_BASE_URL 미설정 — 로그인 mock 성공 처리:', { email });
    saveTokens({ access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' });
    return { email, nickname: mockNicknameByEmail.get(email) ?? null };
  }

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const tokens = await unwrap(res); // TokenResponse
  saveTokens(tokens);

  // 로그인 응답에는 토큰만 있고 닉네임이 없어서, 화면에 보여줄 사용자 정보는 /me로 한 번 더 받아온다.
  try {
    return await fetchMe();
  } catch {
    return { email, nickname: null };
  }
}

/**
 * 구글 로그인 — Google Identity Services가 발급한 id_token을 그대로 서버에 넘긴다.
 * 처음 구글로 가입하는 경우에만 openreview_id가 필요하고, 없이 호출하면 백엔드가
 * 400으로 이를 알려준다 — 이때 err.needsOpenreviewId를 true로 표시해 호출부가
 * openreview_id를 입력받아 같은 id_token으로 재시도할 수 있게 한다.
 * @param {string} idToken
 * @param {string} [openreviewId]
 */
export async function loginWithGoogle(idToken, openreviewId) {
  if (!BASE_URL) {
    console.info('[auth] VITE_API_BASE_URL 미설정 — 구글 로그인 mock 성공 처리');
    saveTokens({ access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' });
    return { email: 'google-mock@example.com', nickname: '구글 사용자' };
  }

  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken, ...(openreviewId ? { openreview_id: openreviewId } : {}) }),
  });
  const body = await res.json().catch(() => null);

  if (res.status === 400 && body?.error?.message?.includes('openreview_id')) {
    const err = new Error(body.error.message);
    err.needsOpenreviewId = true;
    throw err;
  }
  if (!res.ok || !body || body.success === false) {
    throw new Error(body?.error?.message || `구글 로그인에 실패했어요 (${res.status})`);
  }

  saveTokens(body.data);
  try {
    return await fetchMe();
  } catch {
    return { nickname: null };
  }
}

/** refresh_token으로 access_token을 재발급받는다 (refresh_token도 함께 회전). */
export async function refreshAccessToken() {
  const refresh_token = loadRefreshToken();
  if (!refresh_token) throw new Error('로그인이 필요해요.');

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  const tokens = await unwrap(res);
  saveTokens(tokens);
  return tokens;
}

/**
 * 인증이 필요한 API 호출을 감싼다. access_token을 자동으로 싣고, 401이면
 * refresh_token으로 한 번 재발급을 시도한 뒤 같은 요청을 재시도한다.
 */
export async function authorizedFetch(path, options = {}, _retried = false) {
  const token = loadAccessToken();
  if (!token) throw new Error('로그인이 필요해요.');

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      // FormData는 브라우저가 boundary를 포함한 Content-Type을 직접 만들어야 하므로 지정하지 않는다.
      ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 && !_retried) {
    try {
      await refreshAccessToken();
    } catch {
      clearTokens();
      throw new Error('로그인이 만료됐어요. 다시 로그인해 주세요.');
    }
    return authorizedFetch(path, options, true);
  }
  return unwrap(res);
}

/** GET /api/user/me */
export function fetchMe() {
  return authorizedFetch('/api/user/me');
}

export async function logout() {
  if (BASE_URL) {
    try {
      await authorizedFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // 토큰이 이미 만료됐거나 네트워크 문제여도 로컬 토큰은 지우고 로그아웃 처리한다
    }
  }
  clearTokens();
}
