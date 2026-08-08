import { useEffect, useState } from 'react';
import { getPaperStory } from '../../api/papers';
import NarrativeCard from '../story/NarrativeCard';
import Timeline from '../story/Timeline';
import RevisionCompare from './RevisionCompare';
import ReviewBlock from './ReviewBlock';
import { mockStoryFor } from './mockSelectedPapers';

// 상세 화면 — 논문 하나가 리뷰를 받고 무엇을 고쳤는지.
//   제목 → 수정 전/후 대조 → 리뷰 요약 → 심사 타임라인
// 순서가 곧 읽는 순서다: 무엇이 바뀌었는지 먼저 보고, 왜 바뀌었는지(리뷰)를 뒤에 읽는다.

const isAccept = (decision) => (decision || '').startsWith('accept');

export default function PaperDetail({ paper, useMock, onBack }) {
  const [phase, setPhase] = useState(useMock ? 'done' : 'loading');
  const [story, setStory] = useState(useMock ? mockStoryFor(paper) : null);
  const [errorMsg, setErrorMsg] = useState('');

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
    <div className="wr-stack">
      <button type="button" className="onboard-back" onClick={onBack}>← 목록으로</button>

      <div className="wr-card">
        <div className="wr-paper-meta" style={{ marginBottom: 6 }}>
          {paper.venue}
          <span className={`wr-decision${isAccept(paper.decision) ? ' accept' : ''}`}>
            {paper.decision}
          </span>
        </div>
        <h2 className="rp-detail-title">{paper.title}</h2>
        {paper.reason && (
          <div className="wr-selection-reason" style={{ marginTop: 12 }}>
            <b>왜 비슷한가</b> {paper.reason}
          </div>
        )}
      </div>

      {phase === 'loading' && <div className="wr-card"><p className="wr-muted">불러오는 중…</p></div>}
      {phase === 'error' && <div className="wr-card"><div className="auth-submit-error">{errorMsg}</div></div>}

      {phase === 'done' && story && (
        <>
          {/* 리뷰 본문이 최종 수정본이라는 사실은 결과를 읽는 전제라 맨 위에 둔다. */}
          {story.caveats?.length > 0 && (
            <div className="wr-banner">
              {story.caveats.map((c, i) => <p key={i} style={i ? { marginTop: 6 } : undefined}>{c}</p>)}
            </div>
          )}

          <RevisionCompare timeline={story.timeline} />
          <NarrativeCard narrative={story.narrative} />

          {/* 요약은 서버가 추린 문장이고, 이건 리뷰어가 실제로 쓴 원문이다.
              둘 다 필요하다 — 요약만 보고 판단하면 근거를 확인할 수 없다. */}
          {paper.reviews?.length > 0 && (
            <div className="wr-card">
              <div className="wr-card-title">💬 이 논문이 받은 리뷰 {paper.reviews.length}건</div>
              <div className="wr-hint">점수 옆 <b>펼치기</b>를 누르면 리뷰 원문이 나와요.</div>
              <div className="wr-reviews">
                {paper.reviews.map((r, i) => <ReviewBlock key={i} review={r} index={i} />)}
              </div>
            </div>
          )}

          <Timeline events={story.timeline || []} supported={story.timeline_supported} />

          {paper.openreview_url && (
            <div className="wr-card wr-detail-links">
              <a href={paper.openreview_url} target="_blank" rel="noreferrer">
                OpenReview에서 원본 보기 ↗
              </a>
              <span className="wr-muted">리뷰 전문·저자 응답·수정 이력을 원본에서 확인할 수 있어요.</span>
            </div>
          )}

          {story.cached_at && (
            <p className="wr-muted" style={{ textAlign: 'center' }}>
              캐시된 결과 (최초 생성: {new Date(story.cached_at).toLocaleString('ko-KR')})
            </p>
          )}
        </>
      )}
    </div>
  );
}
