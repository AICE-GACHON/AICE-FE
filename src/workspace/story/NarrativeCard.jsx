import { useState } from 'react';

// used_llm=false면 서버가 규칙 기반 스텁 문장을 준 것 — 문장이 짧고 밋밋해도 정상이다.
// (docs/FRONTEND_심사서사_API.md §③) 디자인이 스텁/LLM 두 경우를 다 견디게 한다.
export default function NarrativeCard({ narrative, collapsible = false }) {
  const [expanded, setExpanded] = useState(false);
  if (!narrative) return null;

  const showDetails = !collapsible || expanded;

  return (
    <div className="wr-card">
      <div className="story-card-head">
        <div className="wr-card-title">
          요약
        </div>
        {collapsible && (
          <button
            type="button"
            className="story-detail-toggle"
            aria-expanded={expanded}
            aria-label={expanded ? '요약 자세히 보기 접기' : '요약 자세히 보기'}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? '−' : '+'}
          </button>
        )}
      </div>
      <p className="story-narrative-headline">{narrative.headline}</p>

      {showDetails && narrative.reviewers_asked.length > 0 && (
        <>
          <h4 className="story-subhead">리뷰어가 요구한 것</h4>
          <ul className="story-list">
            {narrative.reviewers_asked.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </>
      )}

      {showDetails && narrative.authors_changed.length > 0 && (
        <>
          <h4 className="story-subhead">저자가 답하거나 고친 것</h4>
          <ul className="story-list">
            {narrative.authors_changed.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </>
      )}

    </div>
  );
}
