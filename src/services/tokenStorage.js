// AICE-BE 로그인은 access_token + refresh_token 한 쌍을 body로 돌려준다 (TokenResponse).
// 탭을 닫아도 로그인이 유지되어야 하므로 온보딩 답변(sessionStorage)과 달리 localStorage에 둔다.
const ACCESS_KEY = 'paper-trace:access_token';
const REFRESH_KEY = 'paper-trace:refresh_token';

export const saveTokens = ({ access_token, refresh_token } = {}) => {
  try {
    if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
  } catch {
    // localStorage 사용 불가 환경 — 이번 세션 동안은 로그인 유지가 안 될 뿐, 진행은 막지 않는다
  }
};

export const loadAccessToken = () => {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
};

export const loadRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
};

export const clearTokens = () => {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // no-op
  }
};
