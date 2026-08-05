import { useState } from 'react';

// AI 파트 4대 규칙 #1: 유사도 점수는 없다. rank + match_type(의미/용어)로만 왜 걸렸는지 보여준다.
const MATCH_LABEL = {
  both: ['의미+용어', '임베딩과 용어 양쪽에서 걸림 — 가장 믿을 만한 매칭'],
  semantic: ['의미', '접근은 비슷하지만 쓰는 용어가 다름'],
  lexical: ['용어', '같은 용어를 쓰지만 접근은 다를 수 있음'],
};

const isAccept = (decision) => (decision || '').startsWith('accept');

function PaperRow({ paper, onSelect }) {
  const match = MATCH_LABEL[paper.match_type];
  return (
    <div className="wr-paper-row wr-paper-row-clickable" onClick={() => onSelect(paper.paper_id)} role="button" tabIndex={0}>
      <span className="wr-paper-rank">{paper.rank}.</span>
      <div className="wr-paper-main">
        <div className="wr-paper-top">
          <span className="wr-paper-title">{paper.title}</span>
          <span className={`wr-decision${isAccept(paper.decision) ? ' accept' : ''}`}>{paper.decision}</span>
        </div>
        <div className="wr-paper-meta">
          {paper.venue} {paper.year}
          {match && <span className="wr-match-badge" title={match[1]}>{match[0]}</span>}
          {paper.avg_rating != null && (
            <>
              {' · '}<b>{paper.avg_rating.toFixed(1)}점</b>
              {paper.rating_vs_venue != null && ` (venue 평균 ${paper.rating_vs_venue >= 0 ? '+' : ''}${paper.rating_vs_venue.toFixed(1)})`}
              {` · 리뷰 ${paper.rating_count}건`}
            </>
          )}
          {paper.rating_spread != null && paper.rating_spread >= 4 && (
            <span className="wr-split-badge" title={`리뷰어 점수가 ${paper.rating_spread}점 차로 갈렸습니다`}>의견 갈림</span>
          )}
        </div>
        {paper.tags?.length > 0 && (
          <div className="wr-tags">
            {paper.tags.map((t, i) => <span key={i} className="wr-tag">{t.kind}: {t.reason}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SimilarPapers({ papers, onSelectPaper }) {
  const [expanded, setExpanded] = useState(false);
  const TOP_SHOWN = 5;
  const shown = papers.slice(0, TOP_SHOWN);
  const rest = papers.slice(TOP_SHOWN);

  return (
    <div className="wr-card">
      <div className="wr-card-title">📄 유사 논문 <span className="wr-pill">상위 {shown.length}편</span></div>
      <div className="wr-hint">논문 제목을 클릭하면 요약과 심사 타임라인을 볼 수 있어요.</div>
      {papers.length === 0 && <div className="wr-muted">결과 없음.</div>}
      {rest.length > 0 && (
        <div className="wr-muted" style={{ marginBottom: 10 }}>
          아래 분석은 유사 논문 {papers.length}편 전체를 기준으로 계산됩니다.
        </div>
      )}
      {shown.map((p) => <PaperRow key={p.paper_id} paper={p} onSelect={onSelectPaper} />)}
      {expanded && rest.map((p) => <PaperRow key={p.paper_id} paper={p} onSelect={onSelectPaper} />)}
      {rest.length > 0 && !expanded && (
        <button type="button" className="wr-more-btn" onClick={() => setExpanded(true)}>
          나머지 {rest.length}편 보기
        </button>
      )}
    </div>
  );
}
