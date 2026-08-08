// 히어로 바로 아래 카드 갤러리 — "우리가 실제로 뭘 보여주는가"를 결과 화면 그대로
// 인용해서 보여준다. 내용은 지어내지 않는다: 아래 텍스트는 전부
// workspace/mockReport.js(LoRA 논문 실측 응답)와 workspace/story/mockStory.js
// (paper_id 27030 실제 예시)에서 그대로 가져온 것이다.
import { useRef } from 'react';
import { MOCK_REPORT } from '../workspace/mockReport';
import { MOCK_STORY } from '../workspace/story/mockStory';

const [lora] = MOCK_REPORT.selected_papers;
const loraTopReview = lora.reviews[0];

// 타임라인은 실제 패널과 같은 규칙으로 시간순 정렬해서 앞부분만 인용한다.
const storyEvents = [...MOCK_STORY.timeline]
  .filter((e) => !(e.kind === 'author_revision' && e.is_baseline))
  .sort((a, b) => a.at - b.at);
const quotedEvents = [storyEvents[0], storyEvents[1], storyEvents[2], storyEvents[storyEvents.length - 1]];

const KIND_DOT = {
  review: 'dot-review', review_update: 'dot-muted', rebuttal: 'dot-author',
  comment: 'dot-muted', author_revision: 'dot-revision', meta_review: 'dot-meta', decision: 'dot-decision',
};

// 카드 안의 흰 패널은 "결과 화면을 캡처해 올려둔 것"처럼 보이게 한다.
function ScreenPanel({ label, children }) {
  return (
    <div className="float-panel">
      <div className="screen-bar">
        <span className="screen-dots"><i /><i /><i /></span>
        <span className="screen-label">{label}</span>
      </div>
      <div className="screen-body">{children}</div>
    </div>
  );
}

export default function GalleryCards() {
  const trackRef = useRef(null);

  const scrollNext = () => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('.gcard');
    const step = card ? card.offsetWidth + 22 : track.clientWidth;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    track.scrollBy({ left: atEnd ? -track.scrollLeft : step, behavior: 'smooth' });
  };

  return (
    <div className="gallery-stage">
      <p className="gallery-note">
        Below is a real analysis — the LoRA paper (arXiv 2106.09685) run through the pipeline,
        shown exactly as the product shows it.
      </p>

      <div className="gallery" ref={trackRef}>
        <article className="gcard tone-deep">
          <ScreenPanel label={`분석 결과 · ${MOCK_REPORT.query_title}`}>
            <div className="sc-head">
              <span className="sc-title">📄 비슷한 논문</span>
              <span className="sc-pill">{MOCK_REPORT.selected_papers.length}편</span>
            </div>
            <div className="sc-paper-top">
              <span className="sc-rank">1.</span>
              <span className="sc-paper-title">{lora.title}</span>
              <span className="sc-decision accept">{lora.decision}</span>
            </div>
            <div className="sc-meta">
              {lora.venue}<span className="sc-badge">확실</span>
              {` · 평균 ${lora.avg_rating}점 · 리뷰 ${lora.rating_count}건`}
            </div>
            <div className="sc-reason"><b>왜 비슷한가</b> {lora.reason}</div>
            <div className="sc-review">
              <span className="sc-review-no">리뷰 1</span>
              <span className="sc-review-score">{loraTopReview.rating_raw}</span>
              <span className="sc-chev">펼치기</span>
            </div>
          </ScreenPanel>
          <div className="gcard-label">Every pick comes with the reason it was picked</div>
        </article>

        <article className="gcard tone-cream">
          <ScreenPanel label="리뷰 원문 · LoRA, ICLR 2022">
            <blockquote className="sc-quote">“{loraTopReview.weaknesses}”</blockquote>
            <div className="sc-quote-src">리뷰어 1 · {loraTopReview.rating_raw}</div>
          </ScreenPanel>
          <div className="gcard-label">Their words, not our summary</div>
        </article>

        <article className="gcard tone-sage">
          <ScreenPanel label={`🕓 심사 타임라인 · ${MOCK_STORY.venue}`}>
            <div className="sc-timeline">
              {quotedEvents.map((e) => (
                <div key={e.event_id} className="sc-event">
                  <span className={`sc-dot ${KIND_DOT[e.kind]}`} />
                  <span className="sc-event-date">{e.date.slice(0, 10)}</span>
                  <span className="sc-event-headline">{e.headline}</span>
                </div>
              ))}
            </div>
          </ScreenPanel>
          <div className="gcard-label">What reviewers asked, what authors changed, what happened next</div>
        </article>

        <article className="gcard tone-deep gcard-more">
          <div className="gcard-label">See the full analysis →</div>
        </article>
      </div>

      <button type="button" className="gallery-nav" onClick={scrollNext} aria-label="다음 카드 보기">›</button>
    </div>
  );
}
