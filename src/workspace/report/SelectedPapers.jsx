import { useState } from 'react';

// 이 화면의 본론. LLM이 고른 논문과 **그 논문이 실제로 받은 리뷰**를 보여준다.
//
// 지켜야 할 것 (AICE-BE README / DEVELOPMENT.md §6):
//  - 예측형 문구 금지. 주어는 항상 유사 논문이다 — "당신은 X를 지적받을 것"이 아니라
//    "이 논문은 X를 지적받았다".
//  - 유사도 점수 없음. confidence는 high/medium/low 3단계뿐이고 숫자로 바꾸면 안 된다.
//  - is_unsplit 리뷰는 강/약점이 분리되지 않아 weaknesses에 **본문 전체**가 들어 있다.
//    '약점'이라고 라벨을 붙이면 안 되고 '리뷰 본문' 한 덩어리로 보여준다.

const CONFIDENCE_LABEL = {
  high: ['확실', '공유하는 내용이 논문에서 분명하게 드러남'],
  medium: ['보통', '비슷하지만 일부만 겹침'],
  low: ['참고', '느슨하게 관련됨'],
};

const isAccept = (decision) => (decision || '').startsWith('accept');

function ReviewBlock({ review, index }) {
  const [open, setOpen] = useState(false);
  const score = review.rating != null ? `${review.rating}점` : '점수 없음';

  return (
    <div className="wr-review">
      <button type="button" className="wr-review-head" onClick={() => setOpen((v) => !v)}>
        <span className="wr-review-no">리뷰 {index + 1}</span>
        <span className="wr-review-score">{review.rating_raw || score}</span>
        {review.is_unsplit && (
          <span className="wr-split-badge" title="이 학회는 강점/약점을 나눠 받지 않아서 리뷰 본문 전체가 들어 있어요">
            본문 전체
          </span>
        )}
        <span className="wr-review-toggle">{open ? '접기' : '펼치기'}</span>
      </button>
      {open && (
        <div className="wr-review-body">
          {review.summary && (
            <div className="wr-review-part">
              <div className="wr-review-part-label">요약</div>
              <p>{review.summary}</p>
            </div>
          )}
          {/* 미분리 리뷰는 weaknesses가 본문 전체다 — '약점'이라 부르지 않는다. */}
          {review.weaknesses && (
            <div className="wr-review-part">
              <div className="wr-review-part-label">{review.is_unsplit ? '리뷰 본문' : '지적받은 점'}</div>
              <p>{review.weaknesses}</p>
            </div>
          )}
          {!review.is_unsplit && review.strengths && (
            <div className="wr-review-part">
              <div className="wr-review-part-label">좋게 본 점</div>
              <p>{review.strengths}</p>
            </div>
          )}
          {review.questions && (
            <div className="wr-review-part">
              <div className="wr-review-part-label">질문</div>
              <p>{review.questions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaperCard({ paper, onOpenStory }) {
  const conf = CONFIDENCE_LABEL[paper.confidence] ?? CONFIDENCE_LABEL.low;
  const splitOpinion = paper.rating_spread != null && paper.rating_spread >= 3;

  return (
    <div className="wr-card wr-selected-card">
      <div className="wr-selected-head">
        <span className="wr-paper-rank">{paper.rank}.</span>
        <div className="wr-paper-main">
          <div className="wr-paper-top">
            <span className="wr-paper-title">{paper.title}</span>
            <span className={`wr-decision${isAccept(paper.decision) ? ' accept' : ''}`}>{paper.decision}</span>
          </div>
          <div className="wr-paper-meta">
            {paper.venue}
            <span className="wr-match-badge" title={conf[1]}>{conf[0]}</span>
            {paper.avg_rating != null && ` · 평균 ${paper.avg_rating}점 · 리뷰 ${paper.rating_count}건`}
            {splitOpinion && (
              <span className="wr-split-badge" title={`리뷰어 점수가 ${paper.rating_spread}점 차로 갈렸어요`}>
                의견 갈림
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="wr-selection-reason">
        <b>왜 비슷한가</b> {paper.reason}
      </div>

      {paper.meta_review && (
        <div className="wr-meta-review">
          <div className="wr-review-part-label">AC 총평</div>
          <p>{paper.meta_review}</p>
        </div>
      )}

      {paper.reviews?.length > 0 ? (
        <div className="wr-reviews">
          <div className="wr-review-part-label">이 논문이 받은 리뷰 {paper.reviews.length}건</div>
          {paper.reviews.map((r, i) => <ReviewBlock key={i} review={r} index={i} />)}
        </div>
      ) : (
        <div className="wr-muted" style={{ marginTop: 10 }}>공개된 리뷰가 없어요.</div>
      )}

      <div className="wr-paper-links">
        <a href={paper.openreview_url} target="_blank" rel="noreferrer">OpenReview에서 원본 보기 ↗</a>
        <button type="button" className="wr-more-btn" onClick={() => onOpenStory(paper.paper_id)}>
          심사 과정 보기
        </button>
      </div>
    </div>
  );
}

export default function SelectedPapers({ papers, onOpenStory }) {
  // 빈 목록은 실패가 아니라 답이다. **후보로 대신 채우면 안 된다** — 본문을 대조해
  // 비슷하지 않다고 판정한 결과이고, 채우면 "비슷한 논문의 리뷰"라는 약속이 거짓이 된다.
  if (!papers?.length) {
    return (
      <div className="wr-card">
        <div className="wr-card-title">비슷한 논문을 찾지 못했어요</div>
        <p className="wr-muted">
          검색에는 걸렸지만 본문을 대조해 보니 같은 문제를 다루는 논문이 아니었어요.
          코퍼스는 ICLR·NeurIPS 논문 43,000여 편이라 그 밖의 주제는 비어 있을 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="wr-stack">
      <div className="wr-card wr-selected-intro">
        <div className="wr-card-title">
          📄 비슷한 논문 <span className="wr-pill">{papers.length}편</span>
        </div>
        <div className="wr-hint">
          올리신 논문의 본문·참고문헌까지 대조해 고른 논문들이에요. 아래는 <b>이 논문들이</b> 받은 실제 리뷰입니다.
        </div>
      </div>
      {papers.map((p) => <PaperCard key={p.paper_id} paper={p} onOpenStory={onOpenStory} />)}
    </div>
  );
}
