import { useEffect, useRef, useState } from 'react';

// 리뷰 한 건 — 접힌 채로 점수만 보이고, 펼치면 본문이 나온다.
// 목록 화면(SelectedPapers, 랜딩 시뮬레이터)과 상세 화면(PaperDetail)이 함께 쓴다.
//
// is_unsplit 리뷰는 강/약점이 분리되지 않아 weaknesses에 **본문 전체**가 들어 있다.
// '약점'이라고 라벨을 붙이면 안 되고 '리뷰 본문' 한 덩어리로 보여준다.
export default function ReviewBlock({ review, index, detailMode = false, open: controlledOpen, onToggle }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const itemRef = useRef(null);
  const open = controlledOpen ?? internalOpen;
  const score = review.rating != null ? `${review.rating}점` : '점수 없음';

  useEffect(() => {
    if (!detailMode || !open) return undefined;

    const frame = requestAnimationFrame(() => {
      const item = itemRef.current;
      if (!item) return;
      const rect = item.getBoundingClientRect();
      const viewportGap = 16;
      const isClipped = rect.top < viewportGap || rect.bottom > window.innerHeight - viewportGap;
      if (!isClipped) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({
        top: rect.top - viewportGap,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [detailMode, open]);

  const toggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen((value) => !value);
  };

  return (
    <div ref={itemRef} className={`wr-review${detailMode ? ' is-detail' : ''}${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="wr-review-head"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="wr-review-no">리뷰 {index + 1}</span>
        <span className="wr-review-score">{review.rating_raw || score}</span>
        {review.is_unsplit && (
          <span className="wr-split-badge"
                title="이 학회는 강점/약점을 나눠 받지 않아서 리뷰 본문 전체가 들어 있어요">
            본문 전체
          </span>
        )}
        <span className="wr-review-toggle" aria-hidden={detailMode ? 'true' : undefined}>
          {detailMode ? (open ? '−' : '+') : (open ? '접기' : '펼치기')}
        </span>
      </button>
      {open && (
        <div className="wr-review-body">
          {review.summary && (
            <div className="wr-review-part">
              <div className="wr-review-part-label">요약</div>
              <p>{review.summary}</p>
            </div>
          )}
          {review.weaknesses && (
            <div className="wr-review-part">
              <div className="wr-review-part-label">
                {review.is_unsplit ? '리뷰 본문' : '지적받은 점'}
              </div>
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
