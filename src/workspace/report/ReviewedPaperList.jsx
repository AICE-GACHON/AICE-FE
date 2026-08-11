// 목록 화면의 본론 — 총 리뷰 요약 + 선정된 논문 제목 목록.
//
// 카드 안에 리뷰를 통째로 펼쳐두지 않는다. 제목만 세워두고 상세는 다음 화면으로
// 넘긴다 — 5편 × 리뷰 4건을 한 페이지에 늘어놓으면 무엇부터 읽어야 할지 알 수 없다.

const CONFIDENCE_LABEL = {
  high: ['확실', '공유하는 내용이 논문에서 분명하게 드러남'],
  medium: ['보통', '비슷하지만 일부만 겹침'],
  low: ['참고', '느슨하게 관련됨'],
};

const isAccept = (decision) => (decision || '').startsWith('accept');

export default function ReviewedPaperList({ papers, summary, onOpen }) {
  if (!papers?.length) return null;

  return (
    <div className="wr-stack">
      {summary && (
        <div className="wr-card">
          <div className="wr-card-title">📝 총 리뷰 요약</div>
          <div className="wr-hint">
            아래 {papers.length}편이 실제로 받은 리뷰를 종합한 내용이에요.
          </div>
          <div className="wr-summary">{summary}</div>

        </div>
      )}

      <div className="wr-card">
        <div className="wr-card-title">
          📄 비슷한 논문 <span className="wr-pill">{papers.length}편</span>
        </div>
        <div className="wr-hint">
          올리신 논문의 본문·참고문헌까지 대조해 고른 논문들이에요.
          <b> 제목을 누르면</b> 그 논문이 리뷰를 받고 무엇을 고쳤는지 볼 수 있어요.
        </div>

        <ol className="rp-list">
          {papers.map((p) => {
            const conf = CONFIDENCE_LABEL[p.confidence] ?? CONFIDENCE_LABEL.low;
            const splitOpinion = p.rating_spread != null && p.rating_spread >= 3;
            return (
              <li key={p.paper_id}>
                <button type="button" className="rp-item" onClick={() => onOpen(p.paper_id)}>
                  <span className="rp-rank">{p.rank}.</span>
                  <span className="rp-main">
                    <span className="rp-title">{p.title}</span>
                    <span className="wr-paper-meta">
                      {p.venue}
                      <span className="wr-match-badge" title={conf[1]}>{conf[0]}</span>
                      {p.avg_rating != null && ` · 평균 ${p.avg_rating}점 · 리뷰 ${p.rating_count}건`}
                      {splitOpinion && (
                        <span className="wr-split-badge"
                              title={`리뷰어 점수가 ${p.rating_spread}점 차로 갈렸어요`}>
                          의견 갈림
                        </span>
                      )}
                    </span>
                  </span>
                  <span className={`wr-decision${isAccept(p.decision) ? ' accept' : ''}`}>
                    {p.decision}
                  </span>
                  <span className="rp-chev" aria-hidden="true">›</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
