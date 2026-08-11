const SCOPE_LABEL = {
  abstract_only: '제목·초록 수정 내역까지 확인함',
  replies_only: '리뷰·저자 응답만 확인함 (수정 이력 비공개 학회)',
};

// used_llm=false면 서버가 규칙 기반 스텁 문장을 준 것 — 문장이 짧고 밋밋해도 정상이다.
// (docs/FRONTEND_심사서사_API.md §③) 디자인이 스텁/LLM 두 경우를 다 견디게 한다.
export default function NarrativeCard({ narrative }) {
  if (!narrative) return null;

  return (
    <div className="wr-card">
      <div className="wr-card-title">
        📝 요약
        {!narrative.used_llm && <span className="wr-pill" style={{ marginLeft: 8 }}>간이 요약</span>}
      </div>
      <p className="story-narrative-headline">{narrative.headline}</p>

      {narrative.reviewers_asked.length > 0 && (
        <>
          <h4 className="story-subhead">리뷰어가 요구한 것</h4>
          <ul className="story-list">
            {narrative.reviewers_asked.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </>
      )}

      {narrative.authors_changed.length > 0 && (
        <>
          <h4 className="story-subhead">저자가 답하거나 고친 것</h4>
          <ul className="story-list">
            {narrative.authors_changed.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </>
      )}

      <p className="story-evidence-scope">
        근거 범위: {SCOPE_LABEL[narrative.evidence_scope] || narrative.evidence_scope}
      </p>
    </div>
  );
}
