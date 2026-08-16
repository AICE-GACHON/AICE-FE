// 분석 이력 공유 모달 — 링크 복사 + 소셜 공유 버튼.
//
// ⚠️ 지금은 **버튼 UI + 클라이언트에서 가능한 만큼**만 동작합니다.
//   · 링크 복사 / X(트위터) / 페이스북 : 별도 키 없이 웹 인텐트 URL로 바로 동작.
//   · 카카오톡 : Kakao JS SDK와 앱 키가 있어야 실제 전송이 됩니다. 지금은 버튼만
//     두고, SDK가 로드돼 있으면(window.Kakao) 시도합니다. 붙이는 방법은
//     docs/BACKEND_요청_사이드바_정리.md의 "공유" 절 참고.
//
// 공유 링크는 현재 라우트(/app/papers/{id})를 그대로 씁니다. 이 경로는 로그인이
// 필요하므로, 로그인 없이 열람 가능한 진짜 공개 공유가 필요해지면 백엔드에 공개
// 조회 엔드포인트가 있어야 합니다(문서 참고).
import { useEffect, useState } from 'react';

export default function ShareDialog({ item, onClose }) {
  const [copied, setCopied] = useState(false);

  const title = item?.title || '분석 결과';
  const shareUrl = `${window.location.origin}/app/papers/${item?.submission_id}`;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // 클립보드 권한이 없으면 사용자가 직접 복사할 수 있게 선택해 준다.
      const input = document.getElementById('share-url-field');
      input?.select();
    }
  }

  function openSocial(kind) {
    const u = encodeURIComponent(shareUrl);
    const t = encodeURIComponent(title);
    if (kind === 'x') {
      window.open(`https://twitter.com/intent/tweet?url=${u}&text=${t}`, '_blank', 'noopener,width=600,height=500');
    } else if (kind === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '_blank', 'noopener,width=600,height=500');
    } else if (kind === 'kakao') {
      // Kakao SDK가 로드·초기화돼 있으면 실제 공유를 시도하고, 아니면 안내만 한다.
      if (window.Kakao?.Share) {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: { title, description: 'PAIR 분석 결과', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
        });
      } else {
        alert('카카오톡 공유는 Kakao SDK 연동 후 사용할 수 있어요. (준비 중)');
      }
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

        <div className="share-url-row">
          <input id="share-url-field" className="share-url" type="text" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
          <button type="button" className={`share-copy${copied ? ' is-done' : ''}`} onClick={copyLink}>
            {copied ? '복사됨' : '링크 복사'}
          </button>
        </div>

        <div className="share-socials">
          <button type="button" className="share-social kakao" onClick={() => openSocial('kakao')}>
            <span className="share-social-dot" aria-hidden="true">K</span>카카오톡
          </button>
          <button type="button" className="share-social x" onClick={() => openSocial('x')}>
            <span className="share-social-dot" aria-hidden="true">X</span>X(트위터)
          </button>
          <button type="button" className="share-social fb" onClick={() => openSocial('facebook')}>
            <span className="share-social-dot" aria-hidden="true">f</span>페이스북
          </button>
        </div>
      </div>
    </div>
  );
}
