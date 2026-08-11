// 컨텍스트 객체와 훅만 둔다. 컴포넌트(AuthProvider)와 한 파일에 섞으면 Fast Refresh가
// 깨져서(react-refresh/only-export-components) 저장할 때마다 로그인 상태가 초기화된다.
import { createContext, useContext } from 'react';

/**
 * @typedef {{
 *   status: 'loading' | 'authed' | 'guest',
 *   user: object | null,
 *   signIn: (user: object) => Promise<void>,
 *   signOut: () => Promise<void>,
 * }} AuthValue
 */

/** @type {import('react').Context<AuthValue | null>} */
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth()는 <AuthProvider> 안에서만 쓸 수 있어요.');
  return ctx;
}
