// 분석 이력 공유 모달 — 공개 링크 발급 + 링크 복사 + 소셜 공유.
//
// **여기서 만드는 링크는 로그인 없이 열린다.** 예전에는 현재 라우트
// (/app/papers/{id})를 문자열로 이어 붙였는데, 그건 로그인 필수 경로라 받은 사람이
// 남의 계정으로 로그인해야만 열 수 있었다 — 즉 공유가 되지 않았다. 지금은 서버에
// 공개 토큰을 발급받아(services/share.js) 그 주소를 공유한다.
//
// 카카오톡 버튼은 뺐다. Kakao JS SDK + 앱 키 + 도메인 등록이 있어야 실제로 전송되는데,
// 없는 상태로 버튼만 두면 누른 사람에게는 그냥 고장으로 보인다. 키가 준비되면
// openSocial에 'kakao' 분기를 되살리면 된다.
//
// ⚠️ 발급은 **모달을 열 때 자동으로** 한다. 사용자가 "공유"를 누른 시점이 곧
// 공개하겠다는 의사이기 때문이다. 대신 되돌릴 수단(공유 중지)을 같은 화면에 둔다 —
// 공개가 한 번의 클릭이면 회수도 한 번의 클릭이어야 한다.
import { useCallback, useEffect, useState } from 'react';

import { createShareLink, revokeShareLink } from '@/services/share';

export default function ShareDialog({ item, onClose }) {
  const [copied, setCopied] = useState(false);
  // 'loading' | 'ready' | 'not-ready' | 'error' | 'revoked'
  const [state, setState] = useState({ status: 'loading', url: '', error: '' });

  const title = item?.title || '분석 결과';
  const submissionId = item?.submission_id;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    if (!submissionId) {
      setState({ status: 'error', url: '', error: '공유할 분석을 찾지 못했어요.' });
      return undefined;
    }
    createShareLink(submissionId)
      .then((data) => { if (alive) setState({ status: 'ready', url: data.url, error: '' }); })
      .catch((err) => {
        if (!alive) return;
        // 409는 오류가 아니라 순서 문제다 — 분석이 끝나야 공유할 것이 생긴다.
        if (err.status === 409) {
          setState({ status: 'not-ready', url: '', error: '' });
          return;
        }
        setState({ status: 'error', url: '', error: err.message || '링크를 만들지 못했어요.' });
      });
    return () => { alive = false; };
  }, [submissionId]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // 클립보드 권한이 없으면 사용자가 직접 복사할 수 있게 선택해 준다.
      document.getElementById('share-url-field')?.select();
    }
  }, [state.url]);

  function openSocial(kind) {
    const u = encodeURIComponent(state.url);
    const t = encodeURIComponent(title);
    const href = kind === 'x'
      ? `https://twitter.com/intent/tweet?url=${u}&text=${t}`
      : `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    window.open(href, '_blank', 'noopener,width=600,height=500');
  }

  async function stopSharing() {
    try {
      await revokeShareLink(submissionId);
      setState({ status: 'revoked', url: '', error: '' });
    } catch (err) {
      setState((s) => ({ ...s, error: err.message || '공유를 중지하지 못했어요.' }));
    }
  }

  return (
    <div className="share-backdrop" onClick={onClose}>
      <div className="share-modal" role="dialog" aria-modal="true" aria-label="공유하기" onClick={(e) => e.stopPropagation()}>
        <div className="share-head">
          <h3 className="share-title">공유하기</h3>
          <button type="button" className="share-x" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <p className="share-sub" title={title}>{title}</p>

        {state.status === 'loading' && <p className="wr-muted">공유 링크를 만드는 중…</p>}

        {state.status === 'not-ready' && (
          <p className="wr-muted">
            분석이 끝난 뒤에 공유할 수 있어요. 결과가 나오면 다시 눌러주세요.
          </p>
        )}

        {state.status === 'error' && <div className="auth-submit-error">{state.error}</div>}

        {state.status === 'revoked' && (
          <p className="wr-muted">
            공유를 중지했어요. 이전에 보낸 링크는 더 이상 열리지 않아요.
          </p>
        )}

        {state.status === 'ready' && (
          <>
            <p className="wr-muted share-note">
              이 링크를 받은 사람은 <strong>로그인 없이</strong> 결과를 볼 수 있어요.
            </p>

            <div className="share-url-row">
              <input
                id="share-url-field" className="share-url" type="text" readOnly
                value={state.url} onFocus={(e) => e.target.select()}
              />
              <button type="button" className={`share-copy${copied ? ' is-done' : ''}`} onClick={copyLink}>
                {copied ? '복사됨' : '링크 복사'}
              </button>
            </div>

            <div className="share-socials">
              <button type="button" className="share-social x" onClick={() => openSocial('x')}>
                <span className="share-social-dot" aria-hidden="true">X</span>X(트위터)
              </button>
              <button type="button" className="share-social fb" onClick={() => openSocial('facebook')}>
                <span className="share-social-dot" aria-hidden="true">f</span>페이스북
              </button>
            </div>

            {state.error && <div className="auth-submit-error">{state.error}</div>}

            <button type="button" className="share-stop" onClick={stopSharing}>
              공유 중지
            </button>
          </>
        )}
      </div>
    </div>
  );
}
