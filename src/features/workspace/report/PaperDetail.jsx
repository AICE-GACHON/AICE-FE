import { useEffect, useState } from 'react';
import { getPaperStory } from '@/services/papers';
import NarrativeCard from '../story/NarrativeCard';
import Timeline from '../story/Timeline';
import BodyDiffPanel from '../story/BodyDiffPanel';
import ReviewBlock from './ReviewBlock';
import { mockStoryFor } from './mockSelectedPapers';
import { decisionLabel, decisionTone } from './decision';

// 상세 화면 — 논문 하나가 리뷰를 받고 무엇을 고쳤는지.
//   제목 → 수정 전/후 대조 → 리뷰 요약 → 심사 타임라인
// 순서가 곧 읽는 순서다: 무엇이 바뀌었는지 먼저 보고, 왜 바뀌었는지(리뷰)를 뒤에 읽는다.

export default function PaperDetail({ paper, useMock, onBack, onReset, resetLabel = '← 새로운 논문 분석하기' }) {
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
      <div className="ws-backrow">
        <button type="button" className="onboard-back" onClick={onBack}>← 목록으로</button>
        {onReset && (
          <>
            <span className="ws-backrow-sep">|</span>
            <button type="button" className="onboard-back" onClick={onReset}>{resetLabel}</button>
          </>
        )}
      </div>

      <div className="wr-card pd-head-card">
        <div className="pd-title-row">
          {/* 폭 규칙은 CSS로 뺐다 — 인라인 스타일은 스타일시트를 이겨서,
              "이보다 좁아지면 링크를 다음 줄로 내려라"는 규칙(.pd-title-main의
              min-width)을 인라인 minWidth:0이 무력화했다. */}
          <div className="pd-title-main">
            {/* 학회 · 최종 결과 · 리뷰 수를 한 줄에 세운다 — 상세로 들어온 순간
                가장 먼저 확인하는 세 가지이고, 표에서 보던 순서와 같다.
                수정 횟수는 여기 안 넣는다 — 바로 아래 BodyDiffPanel의 버전 탭이
                그 횟수 자체이고, 숫자를 두 번 쓰면 어긋날 자리만 늘어난다. */}
            <div className="pd-head-meta">
              <span className="pd-head-venue">{paper.venue}</span>
              {/* "최종 결과"는 칩 밖의 라벨이다 — 안에 넣으면 "최종 결과 · 채택 ·
                  Poster"처럼 가운뎃점이 두 겹이 되어 어디까지가 이름이고 어디부터가
                  값인지 흐려진다. */}
              <span className="pd-head-decision">
                <span className="mono-label">최종 결과</span>
                <span className={`ws-chip ${decisionTone(paper.decision)}`}>
                  {decisionLabel(paper.decision)}
                </span>
              </span>
              {paper.rating_count != null && (
                <span className="pd-head-stats">리뷰 {paper.rating_count}건</span>
              )}
            </div>
            <h2 className="pd-head-title">{paper.title}</h2>
          </div>
          {paper.openreview_url && (
            <a className="pd-openreview-link" href={paper.openreview_url} target="_blank" rel="noreferrer">
              OpenReview에서 전체 보기 ↗
            </a>
          )}
        </div>
        {paper.reason && (
          <div className="pd-why">
            <span className="pd-why-label">WHY</span>
            <span className="pd-why-text">{paper.reason}</span>
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
                {/* 점수만 먼저 늘어놓는다 — 펼치기 전에 "합의된 평가인가
                    갈린 평가인가"가 이 한 줄로 판가름난다. */}
                <div className="wr-card-head" style={{ padding: '0 0 10px' }}>
                  <span className="wr-card-title">이 논문이 받은 리뷰 {paper.reviews.length}건</span>
                  <span className="wr-card-head-meta">
                    {paper.reviews
                      .map((r) => (r.rating != null ? r.rating : '—'))
                      .join(' · ')}
                  </span>
                </div>
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
