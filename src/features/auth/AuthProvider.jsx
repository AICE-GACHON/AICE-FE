// 로그인 상태를 앱 전체가 공유하는 곳. 지금까지는 App.jsx의 useState에만 있어서
// 새로고침 한 번에 사라졌다 — 화면 전환이 state였을 때는 어차피 랜딩으로 돌아가니
// 티가 나지 않았지만, 주소로 화면을 여는 순간(/app/upload 직접 진입, 새로고침, 뒤로가기)
// "토큰은 있는데 user는 null"인 상태가 그대로 드러난다. 그래서 라우터보다 이게 먼저다.
//
// localStorage에는 토큰만 있고 닉네임·이메일은 없다(tokenStorage.js). 사용자 정보는
// 저장하지 않고 매번 GET /api/user/me로 받아온다 — 서버에서 바뀐 값이 조용히 낡지 않게.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMe, logout as logoutRequest } from '@/services/auth';
import { loadAccessToken, clearTokens } from '@/services/tokenStorage';
import { syncAnswersFromServer } from '@/features/onboarding/profileMapping';
import { AuthContext } from './authContext';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// status: 'loading' | 'authed' | 'guest'
//
// 'loading'을 따로 두는 이유 — 토큰이 있어도 /me 응답이 오기 전까지는 로그인 여부를
// 알 수 없다. 이 구간을 guest로 취급하면, 로그인한 사람이 새로고침할 때마다 로그인
// 화면이 한 번 번쩍였다가 돌아온다. 가드는 'loading' 동안 판단을 보류해야 한다.
const LOADING = { status: 'loading', user: null };
const GUEST = { status: 'guest', user: null };

// 세션 복원은 반드시 끝나야 한다. 서버가 죽은 게 아니라 **느린** 경우(응답을 주지도
// 끊지도 않는 상태) fetch는 기본적으로 영원히 기다린다. 그러면 status가 'loading'에
// 갇히고, 그 값으로 판단하는 화면은 빈 채로 멈춘 것처럼 보인다. 로그인 화면을 보여주고
// 다시 시도하게 하는 편이 낫다.
const BOOTSTRAP_TIMEOUT_MS = 8000;

export function AuthProvider({ children }) {
  const [state, setState] = useState(LOADING);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!loadAccessToken()) {
        if (alive) setState(GUEST);
        return;
      }

      // mock 모드(VITE_API_BASE_URL 미설정)에서는 /me를 부를 곳이 없다. 그대로 두면
      // `undefined/api/user/me`가 dev 서버로 나가 index.html(HTML)을 받아오고,
      // JSON 파싱이 깨지면서 매 새로고침마다 의미 없는 요청과 로그아웃이 반복된다.
      // 백엔드 없이 화면만 보는 건 정상적인 개발 방식이므로(vite.config.js 참고)
      // 토큰이 있으면 로그인된 것으로 친다 — 닉네임·이메일은 이번 세션에 없다.
      if (!BASE_URL) {
        console.info('[auth] VITE_API_BASE_URL 미설정 — 저장된 토큰으로 로그인 상태만 복원합니다 (사용자 정보 없음).');
        if (alive) setState({ status: 'authed', user: null });
        return;
      }

      try {
        const user = await fetchMe({ signal: AbortSignal.timeout(BOOTSTRAP_TIMEOUT_MS) });
        if (alive) setState({ status: 'authed', user });
      } catch (err) {
        if (!alive) return;
        // authorizedFetch가 401이면 refresh까지 한 번 시도하고, 그마저 실패하면
        // 이미 토큰을 지운 뒤 던진다. 여기까지 온 401은 정말 만료된 것이다.
        // 반면 네트워크 장애나 서버 다운(5xx)으로 실패한 거라면 토큰은 멀쩡하다 —
        // 지워버리면 서버가 잠깐 흔들린 대가로 전원이 다시 로그인해야 한다.
        if (err.status === 401 || err.status === 403) clearTokens();
        else console.error('세션 복원 실패, 토큰은 유지합니다:', err);
        setState(GUEST);
      }
    })();

    return () => { alive = false; };
  }, []);

  // 로그인·회원가입 성공 직후. 온보딩 답변은 sessionStorage에만 있어서 탭을 닫으면
  // 사라진다. 서버 답변을 먼저 채워넣고 나서 authed로 넘어가야, 업로드 화면이
  // 분야 기본값이 빈 채로 먼저 그려지는 일이 없다. 실패해도 로그인은 진행한다.
  const signIn = useCallback(async (user) => {
    await syncAnswersFromServer();
    setState({ status: 'authed', user });
  }, []);

  const signOut = useCallback(async () => {
    await logoutRequest(); // 서버 token_version을 올리고 로컬 토큰을 지운다
    setState(GUEST);
  }, []);

  // 마이페이지에서 닉네임·OpenReview ID를 바꾼 뒤 서버가 돌려준 값으로 갈아끼운다.
  // 없으면 상단바의 "OO 님"이 로그인 시점의 옛 이름 그대로 남는다 — user는 세션이
  // 시작될 때 한 번 받아오고 끝이기 때문이다.
  const setUser = useCallback((user) => {
    setState((prev) => (prev.status === 'authed' ? { ...prev, user } : prev));
  }, []);

  // 회원 탈퇴는 여기를 거치지 않는다 — 계정이 사라지면 이 Provider를 포함해 앱을
  // 통째로 다시 띄우는 편이 맞아서, routes/index.jsx가 토큰만 지우고 하드 이동한다.
  const value = useMemo(
    () => ({ ...state, signIn, signOut, setUser }),
    [state, signIn, signOut, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
