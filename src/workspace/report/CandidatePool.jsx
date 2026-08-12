import { useState } from 'react';

// 검색이 뽑은 후보 전체. **결과가 아니라 근거 추적용이다** — 기본으로 접어 둔다.
//
// 보여주는 이유: 검색이 무엇을 뽑았고 그중 무엇이 골라졌는지를 사용자가 대조할 수
// 있어야 결과를 신뢰할 근거가 생긴다. 다만 이걸 '유사 논문 목록'처럼 펼쳐 두면
// 고르지 않은 논문까지 결과로 읽히므로, 선택된 것에 표시를 달고 접어 둔다.

const MATCH_LABEL = {
  both: ['의미+용어', '임베딩과 용어 양쪽에서 걸림'],
  semantic: ['의미', '접근은 비슷한데 쓰는 용어가 다름'],
  lexical: ['용어', '같은 용어를 쓰지만 접근은 다를 수 있음'],
};

export default function CandidatePool({ candidates, selectedIds }) {
  const [open, setOpen] = useState(false);
  if (!candidates?.length) return null;

  const chosen = new Set(selectedIds);

  return (
    <div className="wr-card">
      <button
        type="button"
        className="wr-section-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="wr-card-title" style={{ margin: 0 }}>
          🔎 검색이 찾은 후보 {candidates.length}편
        </span>
        <span className="wr-section-toggle">{open ? '접기' : '펼치기'}</span>
      </button>
      {open && (
        <>
          <div className="wr-hint">
            제목·초록 임베딩으로 뽑은 후보예요. 이 중에서 본문까지 대조해 위의 논문들을 골랐어요 —
            <b> 여기 있다고 비슷한 논문은 아니에요.</b>
          </div>
          {candidates.map((c) => {
            const match = MATCH_LABEL[c.match_type];
            return (
              <div key={c.paper_id} className={`wr-candidate${chosen.has(c.paper_id) ? ' picked' : ''}`}>
                <span className="wr-paper-rank">{c.rank}.</span>
                <span className="wr-candidate-title">{c.title}</span>
                <span className="wr-candidate-meta">
                  {c.venue}
                  {match && <span className="wr-match-badge" title={match[1]}>{match[0]}</span>}
                  {chosen.has(c.paper_id) && <span className="wr-picked-badge">선택됨</span>}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
