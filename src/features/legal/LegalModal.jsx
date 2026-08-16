// 회원가입 화면에서 약관을 여는 창.
//
// **왜 모달인가.** 링크로 /terms에 보내면 작성 중이던 가입 폼(닉네임·이메일·
// 비밀번호·초대 코드)이 통째로 날아간다. 돌아와서 처음부터 다시 채우게 만드는
// 화면은 결국 "안 읽고 체크"로 이어진다 — 동의를 받는 화면에서 그건 최악이다.
// 주소로 직접 열고 싶은 경우(푸터 링크, 공유)는 /terms·/privacy 페이지가 따로 있다.
import { useEffect, useRef } from 'react';

import LegalDocumentView from './LegalDocumentView';
import { LEGAL_TITLES } from '@/services/legal';

/**
 * @param {{documentName: 'terms'|'privacy', onClose: () => void}} props
 */
export default function LegalModal({ documentName, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    // 열려 있는 동안 뒤 페이지가 같이 스크롤되지 않게 한다. 원래 값을 기억했다가
    // 되돌리는 이유는, 다른 곳에서 이미 overflow를 만져둔 경우 빈 문자열로
    // 덮어쓰면 그쪽 설정을 지워버리기 때문이다.
    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';

    // Esc로 닫기. 모달에 닫는 방법이 X 버튼 하나뿐이면 키보드 사용자는 갇힌다.
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    // 포커스를 창 안으로 옮긴다. 안 하면 Tab이 뒤에 있는 가입 폼 입력칸으로 가고,
    // 화면 낭독기는 여전히 폼을 읽는다.
    panelRef.current?.focus();

    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="legal-backdrop"
      // 배경을 눌러도 닫힌다. 단 e.target === e.currentTarget일 때만 — 안 그러면
      // 본문에서 드래그로 텍스트를 선택하다 손을 떼는 순간 창이 닫힌다.
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="legal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={LEGAL_TITLES[documentName]}
        tabIndex={-1}
        ref={panelRef}
      >
        <header className="legal-panel-head">
          <strong>{LEGAL_TITLES[documentName]}</strong>
          <button type="button" className="legal-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <div className="legal-panel-body">
          <LegalDocumentView documentName={documentName} />
        </div>

        <footer className="legal-panel-foot">
          <button type="button" className="pill" onClick={onClose}>확인</button>
        </footer>
      </div>
    </div>
  );
}
