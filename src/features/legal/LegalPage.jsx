// /terms · /privacy — 주소로 직접 여는 단독 페이지.
//
// 모달과 둘 다 있는 이유: 가입 화면에서는 폼을 잃지 않도록 모달로 띄우지만,
// 푸터 링크·외부 공유·"약관 전문을 보내주세요" 같은 요청에는 고유 주소가 있어야
// 한다. 본문 렌더는 LegalDocumentView 하나를 공유하므로 둘이 갈라지지 않는다.
import { LEGAL_TITLES } from '@/services/legal';
import LegalDocumentView from './LegalDocumentView';

/**
 * @param {{documentName: 'terms'|'privacy', onBack: () => void}} props
 */
export default function LegalPage({ documentName, onBack }) {
  return (
    <div className="legal-page">
      <div className="wrap legal-page-inner">
        <button type="button" className="onboard-back" onClick={onBack}>← 돌아가기</button>
        <h1 className="legal-page-title">{LEGAL_TITLES[documentName]}</h1>
        <LegalDocumentView documentName={documentName} />
      </div>
    </div>
  );
}
