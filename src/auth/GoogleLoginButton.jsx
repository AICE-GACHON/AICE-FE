import { useEffect, useRef, useState } from 'react';
import googleLogo from '../assets/Google.png';

// Google Identity Services(GIS) — 프론트가 구글과 직접 통신해 id_token을 받고,
// 백엔드(app/core/google_oauth.py)는 그 토큰의 서명/audience/만료만 검증한다.
// GOOGLE_CLIENT_ID는 Google Cloud Console(APIs & Services > Credentials)에서
// OAuth 2.0 클라이언트 ID(웹 애플리케이션)를 만들어야 나온다 — 프론트/백엔드 둘 다
// 같은 값을 써야 하므로, 이 값이 없으면 버튼을 비활성 안내로만 보여준다.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GIS_SRC = 'https://accounts.google.com/gsi/client';

function loadGisScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener('load', resolve, { once: true }));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * @param {(idToken: string) => void} onCredential - 로그인 성공 시 구글이 준 id_token
 */
export default function GoogleLoginButton({ onCredential }) {
  const slotRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGisScript().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !slotRef.current) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => onCredential(response.credential),
    });
    window.google.accounts.id.renderButton(slotRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
    });
  }, [ready, onCredential]);

  if (!CLIENT_ID) {
    return (
      <div className="auth-google-btn auth-google-btn-disabled" title="VITE_GOOGLE_CLIENT_ID가 설정되면 활성화됩니다.">
        <img className="auth-google-icon" src={googleLogo} alt="" />
        Google로 계속하기 (설정 필요)
      </div>
    );
  }

  return <div ref={slotRef} className="google-btn-slot" />;
}
