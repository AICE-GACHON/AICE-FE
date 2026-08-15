// 약관·개인정보처리방침 원문 렌더. 모달(LegalModal)과 단독 페이지(LegalPage)가
// 같은 것을 쓴다 — 두 곳이 각자 fetch하면 로딩·에러 처리가 갈라지고, 한쪽만
// 고쳐지는 순간 "모달에서는 보이는데 주소로 들어가면 안 보인다"가 된다.
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { fetchLegalDocument, LEGAL_TITLES } from '../api/legal';

// 표를 가로 스크롤 상자로 감싼다. 문서의 핵심(수집 항목·보유기간·국외이전)이
// 전부 표라, 좁은 화면에서 칸이 찌그러지면 읽을 수가 없다. 감싸지 않으면 대신
// 페이지 전체가 좌우로 밀린다.
const MARKDOWN_COMPONENTS = {
  table: (props) => (
    <div className="legal-table-scroll">
      <table {...props} />
    </div>
  ),
};

const LOADING = { status: 'loading', doc: null, error: '' };

/**
 * @param {{documentName: 'terms'|'privacy'}} props
 */
export default function LegalDocumentBody({ documentName }) {
  const [state, setState] = useState(LOADING);

  // documentName이 바뀌었는데 이 컴포넌트가 재사용되는 경우 로딩 상태로 되돌린다.
  // effect 안에서 setState하면 렌더가 한 번 더 도므로 렌더 중에 비교한다
  // (routes.jsx PastAnalysisRoute와 같은 방식).
  const [loadedFor, setLoadedFor] = useState(documentName);
  if (documentName !== loadedFor) {
    setLoadedFor(documentName);
    setState(LOADING);
  }

  useEffect(() => {
    let alive = true;

    fetchLegalDocument(documentName)
      .then((doc) => {
        if (alive) setState({ status: 'ready', doc, error: '' });
      })
      .catch((err) => {
        if (alive) setState({ status: 'error', doc: null, error: err.message || '불러오지 못했어요.' });
      });

    // documentName이 바뀌었는데 이전 요청이 늦게 도착하면 엉뚱한 문서가 그려진다.
    return () => { alive = false; };
  }, [documentName]);

  if (state.status === 'loading') {
    return <p className="legal-status">{LEGAL_TITLES[documentName]}을(를) 불러오는 중…</p>;
  }

  if (state.status === 'error') {
    return (
      <div className="legal-status legal-status-error">
        <p>약관을 불러오지 못했어요.</p>
        <p className="fine">{state.error}</p>
      </div>
    );
  }

  return (
    <article className="legal-doc">
      {/* 버전은 문서 본문 머리말에도 있지만 여기 한 번 더 띄운다 — "내가 지금
          보는 게 어느 버전인가"는 동의 화면에서 특히 중요하다. */}
      <div className="legal-doc-meta">버전 {state.doc.version}</div>
      <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {state.doc.content}
      </Markdown>
    </article>
  );
}
