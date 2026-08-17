// 히어로 바로 아래 카드 갤러리 — "우리가 실제로 뭘 보여주는가"를 결과 화면 그대로
// 인용해서 보여준다. 내용은 지어내지 않는다: 아래 텍스트는 전부
// workspace/mockReport.js(LoRA 논문 실측 응답)와 workspace/story/mockStory.js에서
// 그대로 가져온 것이다.
//
// 카드는 5장이고, 두 벌(원본 + aria-hidden 복제본)을 이어 붙여 CSS 애니메이션
// (@keyframes gallery-belt)으로 끊김 없이 흐르는 벨트를 만든다. 마우스를 올리거나
// 포커스가 들어오면 벨트가 멈춘다(index.css). 처음 화면에 들어올 때만
// IntersectionObserver로 카드가 순서대로 떠오르고(is-in), 등장이 끝나면 is-settled로
// 애니메이션을 걷어 벨트 흐름만 남긴다.
import { useEffect, useRef, useState } from 'react';
import { MOCK_REPORT } from '@/services/mocks/mockReport';
import { MOCK_STORY } from '@/services/mocks/mockStory';
import { decisionLabel, decisionTone } from '@/features/workspace/report/decision';

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

// 종합 요약은 마크다운을 문단(빈 줄) 단위로 나눠 인용한다. 첫 줄은 제목(## …)이고
// 나머지는 실제 화면(ReviewedPaperList)의 "총 리뷰 요약" 카드가 보여주는 그대로
// 전부 한 카드에 담는다 — 마지막 문단만 떼어 별도 카드로 나누면, 실제로는 한
// 카드인 걸 두 장으로 쪼개 보여주는 셈이라 그것도 화면과 달라진다.
const [summaryHeading, , ...summaryParagraphs] = MOCK_REPORT.summary_markdown.split('\n\n');

// "본문 변경 이력"(BodyDiffPanel)은 실제 API로 그때그때 받아오는 화면이라 정적
// 목업이 없다 — 대신 같은 단어 단위 diff 표기(diff-ins/diff-del)를 쓰는 저자
// 수정 이력(RevisionDiff, PaperStoryPanel의 심사 타임라인 안)에서 실제 목업
// 문장을 그대로 인용한다.
const revisionEvent = MOCK_STORY.timeline.find((e) => e.kind === 'author_revision' && !e.is_baseline);
const revisionChange = revisionEvent.changes[0];

// **굵게** 표기만 살려서 렌더한다. [E1] 같은 인용 표시는 본문 그대로 둔다.
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**')
      ? <b key={i}>{seg.slice(2, -2)}</b>
      : <span key={i}>{seg}</span>);
}

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

// 카드 5장 한 벌. 벨트가 끊김 없이 돌도록 이 세트를 두 번 이어 붙이는데,
// 두 번째(clone)는 보조 화면 낭독기에 중복으로 읽히지 않게 aria-hidden 처리한다.
function GallerySet({ clone = false }) {
  return (
    <div className="gallery-set" aria-hidden={clone || undefined}>
      <article className="gcard tone-deep">
        <ScreenPanel label={`분석 결과 · ${MOCK_REPORT.query_title}`}>
          <div className="sc-head">
            <span className="sc-title">📄 비슷한 논문</span>
            <span className="sc-pill">{MOCK_REPORT.selected_papers.length}편</span>
          </div>
          {/* 표 형태다 — 실제 화면(ReviewedPaperList)이 카드 한 장씩이 아니라
              표로 목록을 세운다. 여기서도 같은 모양을 인용한다. */}
          <div className="sc-table">
            <div className="sc-table-head">
              <span>#</span><span>TITLE</span><span>최종 결과</span>
            </div>
            {MOCK_REPORT.selected_papers.map((p) => (
              <div key={p.paper_id} className="sc-table-row">
                <span className="sc-rank">{p.rank}</span>
                <span className="sc-table-title">{p.title}</span>
                <span className={`sc-decision${decisionTone(p.decision) === 'accept' ? ' accept' : ''}`}>
                  {decisionLabel(p.decision)}
                </span>
              </div>
            ))}
          </div>
          <div className="sc-reason"><b>WHY</b> {lora.reason}</div>
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

      <article className="gcard tone-deep">
        <ScreenPanel label={`📝 총 리뷰 요약 · ${MOCK_REPORT.selected_papers.length}편 종합`}>
          <div className="sc-hint">아래 {MOCK_REPORT.selected_papers.length}편이 실제로 받은 리뷰를 종합한 내용이에요.</div>
          <div className="sc-sum-head">{summaryHeading.replace('## ', '')}</div>
          {summaryParagraphs.map((para) => (
            <p key={para} className="sc-sum-p">{renderInline(para)}</p>
          ))}
        </ScreenPanel>
        <div className="gcard-label">One summary across every review, not one per paper</div>
      </article>

      <article className="gcard tone-sage is-centered">
        <ScreenPanel label={`✎ 본문 변경 이력 · ${revisionEvent.headline}`}>
          <div className="sc-revision-label">
            {revisionChange.label}
            <span className="wr-muted"> — 유사도 {revisionChange.similarity.toFixed(2)}</span>
          </div>
          <p className="sc-revision-text">
            {revisionChange.segments.map((s, i) => (
              <span key={i} className={s.op === 'insert' ? 'diff-ins' : s.op === 'delete' ? 'diff-del' : undefined}>
                {s.text}
              </span>
            ))}
          </p>
        </ScreenPanel>
        <div className="gcard-label">Every revision, word for word — nothing paraphrased</div>
      </article>
    </div>
  );
}

export default function GalleryCards() {
  const stageRef = useRef(null);
  const [isIn, setIsIn] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  // 화면에 처음 들어올 때 등장 애니메이션을 켠다. IntersectionObserver가 없는
  // 환경이면 그냥 바로 보여준다. 관찰이 안 잡히는 경우를 대비해 1.5초 뒤 위치를
  // 직접 확인하는 보조 타이머도 둔다.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsIn(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setIsIn(true);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(el);
    const fallback = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setIsIn(true);
        observer.disconnect();
      }
    }, 1500);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  // 등장이 끝나면 카드별 애니메이션을 걷어낸다 — 그래야 벨트 흐름만 깔끔히 남는다.
  useEffect(() => {
    if (!isIn) return;
    const timer = setTimeout(() => setIsSettled(true), 1100);
    return () => clearTimeout(timer);
  }, [isIn]);

  return (
    <div
      ref={stageRef}
      className={`gallery-stage${isIn ? ' is-in' : ''}${isSettled ? ' is-settled' : ''}`}
    >
      <p className="gallery-note">
        Below is a real analysis — the LoRA paper (arXiv 2106.09685) run through the pipeline,
        shown exactly as the product shows it.
      </p>

      <div className="gallery-viewport">
        <div className="gallery-belt">
          <GallerySet />
          <GallerySet clone />
        </div>
      </div>
    </div>
  );
}
