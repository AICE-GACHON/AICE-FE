// 약관이 개정됐을 때 재동의를 받는 띠.
//
// 서버가 판정한다 — user.consent_up_to_date가 false면 "가입 때 동의한 버전이
// 지금 게시된 버전과 다르다"는 뜻이다. 프론트가 버전 문자열("1.0")을 들고 직접
// 비교하지 않는 이유는, 그러면 문서를 고치고 서버만 올렸을 때 화면이 조용히
// 옛 상태로 남기 때문이다(AICE-BE app/models/user.py consent_up_to_date).
//
// **로그인을 막지 않는다.** 재동의 전까지 아무것도 못 하게 하면 그 사용자는
// 재동의도, 탈퇴도, 자기 자료를 내려받는 것도 할 수 없다. 대신 눈에 띄는 자리에
// 계속 남아 있게 한다 — 닫기 버튼이 없는 것은 의도다.
import { useState } from 'react';

import { agreeToCurrentTerms } from '../api/auth';
import LegalModal from './LegalModal';

/**
 * @param {{onAgreed: (user: object) => void}} props
 *   onAgreed — 갱신된 UserResponse. **반드시 화면 상태에 반영해야 한다.** 안 그러면
 *   consent_up_to_date가 여전히 false인 옛 user가 남아 이 띠가 계속 보인다.
 */
export default function ConsentBanner({ onAgreed }) {
  const [openDocument, setOpenDocument] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const agree = async () => {
    setSubmitting(true);
    setError('');
    try {
      onAgreed(await agreeToCurrentTerms());
    } catch (err) {
      setError(err.message || '동의를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="consent-banner" role="region" aria-label="약관 개정 안내">
      <div className="consent-banner-text">
        <strong>이용약관과 개인정보처리방침이 개정되었어요.</strong>
        <span>
          내용을 확인하고 동의해 주세요.{' '}
          <button type="button" className="legal-inline-link" onClick={() => setOpenDocument('terms')}>
            이용약관
          </button>
          {' · '}
          <button type="button" className="legal-inline-link" onClick={() => setOpenDocument('privacy')}>
            개인정보처리방침
          </button>
        </span>
        {error && <span className="consent-banner-error">{error}</span>}
      </div>

      <button type="button" className="pill" onClick={agree} disabled={submitting}>
        {submitting ? '처리 중…' : '동의하고 계속하기'}
      </button>

      {openDocument && (
        <LegalModal documentName={openDocument} onClose={() => setOpenDocument(null)} />
      )}
    </div>
  );
}
