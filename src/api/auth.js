// 백엔드 연동 지점 — 회원가입/로그인/구글 로그인/토큰 재발급/로그아웃.
// AICE-BE 실제 스펙 기준 (app/routers/auth.py, app/schemas/auth.py, DEVELOPMENT.md §7):
//   POST /api/auth/signup  { email, password, nickname, openreview_id, onboarding_id? } -> UserResponse (201, 토큰 없음)
//   POST /api/auth/login   { email, password }               -> { access_token, refresh_token, token_type }
//   POST /api/auth/google  { id_token, openreview_id? }       -> { access_token, refresh_token, token_type }
//   POST /api/auth/refresh { refresh_token }                 -> { access_token, refresh_token, token_type } (회전)
//   POST /api/auth/logout  (인증 필요)                        -> 서버가 token_version을 올려 이전 refresh_token을 전부 무효화
//   GET  /api/user/me      (인증 필요)                        -> UserResponse
//   POST /api/auth/password/forgot { email }                 -> 200 (가입 여부와 무관하게 항상 200)
//   POST /api/auth/password/reset  { token, new_password }   -> 200 / 400(만료·재사용 토큰)
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
    const err = new Error(body?.error?.message || `요청에 실패했어요 (${res.status})`);
    // 호출부가 상태로 갈라야 할 때가 있다 — 예를 들어 온보딩 답변 404는 오류가
    // 아니라 "아직 없음"이다. 메시지 문자열로 판별하게 두면 서버 문구가 바뀌는
    // 순간 조용히 깨진다.
    err.status = res.status;
    throw err;
  }
  return body.data;
}

/**
 * inviteCode는 배포 환경에서 **필수**다. 서버가 SIGNUP_INVITE_CODE를 설정한 채로
 * 떠 있으면(배포 기본값) 코드 없이 보낸 가입은 403 "초대 코드가 필요합니다"로
 * 거절된다. 개발 서버는 보통 비어 있어서 이 값을 무시한다.
 *
 * @param {{email: string, password: string, nickname: string, openreviewId: string, inviteCode?: string, onboardingId?: string|null}} payload
 */
export async function signup({ email, password, nickname, openreviewId, inviteCode, onboardingId }) {
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
      ...(inviteCode ? { invite_code: inviteCode } : {}),
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
 * 처음 구글로 가입하는 계정에만 openreviewId·inviteCode가 필요하다. 이미 가입한
 * 사람의 로그인에는 서버가 둘 다 요구하지 않는다 — 초대받아 가입한 사람이 로그인할
 * 때마다 코드를 다시 입력해야 한다면 그건 초대가 아니라 비밀번호다.
 *
 * @param {string} idToken
 * @param {string} [openreviewId]
 * @param {string} [inviteCode]
 */
export async function loginWithGoogle(idToken, openreviewId, inviteCode) {
  if (!BASE_URL) {
    console.info('[auth] VITE_API_BASE_URL 미설정 — 구글 로그인 mock 성공 처리');
    saveTokens({ access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' });
    return { email: 'google-mock@example.com', nickname: '구글 사용자' };
  }

  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_token: idToken,
      ...(openreviewId ? { openreview_id: openreviewId } : {}),
      ...(inviteCode ? { invite_code: inviteCode } : {}),
    }),
  });
  const body = await res.json().catch(() => null);

  // 서버는 신규 가입일 때만 이 둘을 요구한다. 순서가 있다 — 초대 코드를 먼저
  // 보고(403), 통과하면 openreview_id를 본다(400). 화면에서는 한 번에 받는다.
  if (res.status === 403) {
    const err = new Error(body?.error?.message || '초대 코드가 필요합니다.');
    err.needsInvite = true;
    throw err;
  }
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

/**
 * 비밀번호 재설정 메일 요청.
 *
 * 서버는 가입되지 않은 이메일에도 200을 준다 — 어떤 이메일이 가입돼 있는지
 * 알아내는 통로가 되면 안 되기 때문이다. 그래서 이 함수도 "보냈다/못 보냈다"를
 * 구분해 돌려주지 않는다. 화면 문구도 마찬가지로 단정하면 안 된다.
 *
 * @param {{email: string}} payload
 */
export async function requestPasswordReset({ email }) {
  if (!BASE_URL) {
    console.info('[auth] VITE_API_BASE_URL 미설정 — 비밀번호 찾기 mock 처리:', { email });
    return;
  }

  const res = await fetch(`${BASE_URL}/api/auth/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  await unwrap(res); // 200 외에는 네트워크/서버 장애뿐이라 그대로 에러로 올린다
}

/**
 * 메일 링크(/reset-password?token=...)로 받은 토큰과 새 비밀번호를 보낸다.
 * 만료됐거나 이미 쓴 토큰이면 400 — 이건 사용자가 고칠 수 없는 상태라
 * err.tokenInvalid로 표시해서, 화면이 "다시 시도"가 아니라 "링크를 다시 받기"를
 * 안내하게 한다.
 *
 * @param {{token: string, newPassword: string}} payload
 */
export async function resetPassword({ token, newPassword }) {
  if (!BASE_URL) {
    console.info('[auth] VITE_API_BASE_URL 미설정 — 비밀번호 재설정 mock 성공 처리');
    return;
  }

  const res = await fetch(`${BASE_URL}/api/auth/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  const body = await res.json().catch(() => null);

  if (res.status === 400) {
    const err = new Error(
      body?.error?.message || '링크가 만료됐거나 이미 사용됐어요.',
    );
    err.tokenInvalid = true;
    throw err;
  }
  if (!res.ok || !body || body.success === false) {
    throw new Error(body?.error?.message || `비밀번호 재설정에 실패했어요 (${res.status})`);
  }
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
