import { useState } from 'react';
import RevisionDiff from './RevisionDiff';

const KIND_TONE = {
  review: 'blue', review_update: 'muted', rebuttal: 'author', comment: 'muted',
  author_revision: 'green', meta_review: 'amber', decision: 'strong',
};

function ReviewBody({ review }) {
  if (!review) return null;
  // 2023년 이전 학회는 강/약점이 안 나뉘어 weaknesses에 리뷰 본문 전체가 들어온다 —
  // 이때 '약점'이라고 라벨을 붙이면 안 되고 '리뷰 본문' 한 덩어리로 보여줘야 한다.
  if (review.is_unsplit) {
    return <p className="story-review-body">{review.weaknesses || review.summary}</p>;
  }
  return (
    <div className="story-review-body">
      {review.summary && <p><b>요약</b> {review.summary}</p>}
      {review.strengths && <p><b>강점</b> {review.strengths}</p>}
      {review.weaknesses && <p><b>약점</b> {review.weaknesses}</p>}
      {review.questions && <p><b>질문</b> {review.questions}</p>}
    </div>
  );
}

function TimelineItem({ event }) {
  const [open, setOpen] = useState(false);
  // review_update는 "이 시점에 수정됐고 최종 점수는 N점"이라는 사실 하나뿐이라
  // headline만으로 충분하다 — 펼쳐도 보여줄 게 없다 (수정 전 점수는 복원 불가).
  const expandable = event.kind !== 'review_update';

  return (
    <div className={`story-event tone-${KIND_TONE[event.kind] || 'muted'}`}>
      <button
        type="button"
        className="story-event-head"
        onClick={() => expandable && setOpen((o) => !o)}
        style={expandable ? undefined : { cursor: 'default' }}
      >
        <span className="story-event-date">{event.date}</span>
        <span className="story-event-actor">{event.actor}</span>
        <span className="story-event-headline">{event.headline}</span>
        {expandable && <span className="story-event-chev">{open ? '▾' : '▸'}</span>}
      </button>

      {open && expandable && (
        <div className="story-event-body">
          {event.kind === 'review' && <ReviewBody review={event.review} />}
          {(event.kind === 'rebuttal' || event.kind === 'comment' || event.kind === 'meta_review' || event.kind === 'decision') && (
            <p className="story-review-body">{event.text}</p>
          )}
          {event.kind === 'author_revision' && <RevisionDiff changes={event.changes} isBaseline={event.is_baseline} />}
        </div>
      )}
    </div>
  );
}

export default function Timeline({ events, supported }) {
  if (!supported) {
    return (
      <div className="wr-card">
        <div className="wr-card-title">🕓 심사 타임라인</div>
        {/* timeline_supported=false는 "심사가 없었다"가 아니라 "공개되지 않는다"는 뜻 —
            위쪽 caveats 배너에 그 이유가 이미 노출돼 있다. */}
        <p className="wr-muted">이 학회는 심사 타임라인을 공개하지 않습니다. 위 안내를 참고해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="wr-card">
      <div className="wr-card-title">🕓 심사 타임라인</div>
      <div className="wr-hint">항목을 클릭하면 세부 내용이 펼쳐져요.</div>
      {events.length === 0 && (
        <p className="wr-muted">심사 이벤트가 없습니다 (철회·데스크리젝 등으로 리뷰 자체가 없을 수 있습니다).</p>
      )}
      <div className="story-timeline">
        {events.map((e) => <TimelineItem key={e.event_id} event={e} />)}
      </div>
    </div>
  );
}
