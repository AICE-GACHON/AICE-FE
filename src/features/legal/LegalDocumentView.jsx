// 약관 본문의 **지연 로딩 경계**.
//
// 본문 렌더는 react-markdown + remark-gfm을 쓰는데, 이게 gzip 기준 40kB쯤 된다.
// 약관은 가입할 때 한 번, 그마저도 눌러야 여는 화면이라 — 모든 사용자가 첫 진입에
// 그 비용을 내는 것은 맞지 않는다. 실제로 메인 번들이 그만큼 커졌던 것을 보고
// 갈랐다.
//
// 껍데기(모달 틀·페이지 제목)는 즉시 뜨고 본문만 나중에 채워진다. 사용자 입장에서는
// 창이 바로 열리고 안이 잠깐 비는 것이라, 오히려 통째로 기다리는 것보다 낫다.
import { lazy, Suspense } from 'react';

import { LEGAL_TITLES } from '@/services/legal';

const LegalDocumentBody = lazy(() => import('./LegalDocumentBody'));

/**
 * @param {{documentName: 'terms'|'privacy'}} props
 */
export default function LegalDocumentView({ documentName }) {
  return (
    <Suspense
      fallback={<p className="legal-status">{LEGAL_TITLES[documentName]}을(를) 불러오는 중…</p>}
    >
      <LegalDocumentBody documentName={documentName} />
    </Suspense>
  );
}
