import { useEffect, useState } from 'react';
import { getPaperStory } from '../../api/papers';
import NarrativeCard from '../story/NarrativeCard';
import Timeline from '../story/Timeline';
import BodyDiffPanel from '../story/BodyDiffPanel';
import ReviewBlock from './ReviewBlock';
import { mockStoryFor } from './mockSelectedPapers';

// 상세 화면 — 논문 하나가 리뷰를 받고 무엇을 고쳤는지.
//   제목 → 수정 전/후 대조 → 리뷰 요약 → 심사 타임라인
// 순서가 곧 읽는 순서다: 무엇이 바뀌었는지 먼저 보고, 왜 바뀌었는지(리뷰)를 뒤에 읽는다.

const isAccept = (decision) => (decision || '').startsWith('accept');

export default function PaperDetail({ paper, useMock, onBack, onReset }) {
  const [phase, setPhase] = useState(useMock ? 'done' : 'loading');
  const [story, setStory] = useState(useMock ? mockStoryFor(paper) : null);
  const [errorMsg, setErrorMsg] = useState('');
  const [openReviewIndex, setOpenReviewIndex] = useState(null);

  useEffect(() => {
    if (useMock) return;
    let cancelled = false;
    getPaperStory(paper.paper_id)
      .then((data) => { if (!cancelled) { setStory(data); setPhase('done'); } })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '심사 이력을 불러오지 못했어요.');
        setPhase('error');
      });
    return () => { cancelled = true; };
  }, [paper.paper_id, useMock]);

  return (
    <div className="pd-wide">
      <div className="pd-back-row">
        <button type="button" className="onboard-back" onClick={onBack}>← 목록으로</button>
        {onReset && <button type="button" className="onboard-back" onClick={onReset}>← 새 논문 분석하기</button>}
      </div>

      <div className="wr-card">
        <div className="pd-title-row">
          <div>
            <div className="wr-paper-meta" style={{ marginBottom: 6 }}>
              {paper.venue}
              <span className={`wr-decision${isAccept(paper.decision) ? ' accept' : ''}`}>
                {paper.decision}
              </span>
            </div>
            <h2 className="rp-detail-title">{paper.title}</h2>
          </div>
          {paper.openreview_url && (
            <a className="pd-openreview-link" href={paper.openreview_url} target="_blank" rel="noreferrer">
              OpenReview에서 전체 내용 보기 ↗
            </a>
          )}
        </div>
        {paper.reason && (
          <div className="wr-selection-reason" style={{ marginTop: 12 }}>
            <b>왜 비슷한가</b> {paper.reason}
          </div>
        )}
      </div>

      {phase === 'loading' && <div className="wr-card"><p className="wr-muted">불러오는 중…</p></div>}
      {phase === 'error' && <div className="wr-card"><div className="auth-submit-error">{errorMsg}</div></div>}

      {phase === 'done' && story && (
        <div className="pd-columns">
          <BodyDiffPanel paperId={paper.paper_id} layout="inline" />

          <div className="wr-stack pd-right">
            <NarrativeCard narrative={story.narrative} collapsible />

            {/* 요약은 서버가 추린 문장이고, 이건 리뷰어가 실제로 쓴 원문이다.
                둘 다 필요하다 — 요약만 보고 판단하면 근거를 확인할 수 없다. */}
            {paper.reviews?.length > 0 && (
              <div className="wr-card">
                <div className="wr-card-title">이 논문이 받은 리뷰 {paper.reviews.length}건</div>
                <div className="wr-reviews">
                  {paper.reviews.map((review, index) => (
                    <ReviewBlock
                      key={index}
                      review={review}
                      index={index}
                      detailMode
                      open={openReviewIndex === index}
                      onToggle={() => setOpenReviewIndex((current) => (current === index ? null : index))}
                    />
                  ))}
                </div>
              </div>
            )}

            <Timeline events={story.timeline || []} supported={story.timeline_supported} />
          </div>
        </div>
      )}
    </div>
  );
}
