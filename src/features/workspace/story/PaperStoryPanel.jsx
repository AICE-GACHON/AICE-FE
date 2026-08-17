import { useEffect, useState } from 'react';
import { getPaperStory } from '@/services/papers';
import JourneyBadge from './JourneyBadge';
import NarrativeCard from './NarrativeCard';
import Timeline from './Timeline';
import BodyDiffPanel from './BodyDiffPanel';

const isAccept = (decision) => (decision || '').startsWith('accept');

export default function PaperStoryPanel({ paperId, onClose }) {
  const [phase, setPhase] = useState('loading'); // loading | done | error
  const [story, setStory] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // paperId가 바뀌면 컴포넌트가 key={paperId}로 새로 마운트되므로(ResultReport.jsx),
  // 여기서는 상태를 수동으로 초기화할 필요 없이 이번 paperId에 대한 요청만 신경 쓰면 된다.
  useEffect(() => {
    let cancelled = false;

    getPaperStory(paperId)
      .then((data) => {
        if (cancelled) return;
        setStory(data);
        setPhase('done');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '심사 서사를 불러오지 못했어요.');
        setPhase('error');
      });

    return () => { cancelled = true; };
  }, [paperId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 이 패널은 position:fixed 오버레이라 뒤에 깔린 페이지가 화면엔 안 보이지만
  // 여전히 스크롤은 가능하다 — 그대로 두면 뒷페이지 스크롤바가 오버레이 오른쪽
  // 끝에 하나 더 뜬다(패널 자체 스크롤바와 별개로). 열려있는 동안만 잠근다.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  return (
    <div className="story-overlay" onClick={onClose}>
      <BodyDiffPanel paperId={paperId} />

      <div className="story-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="story-close" onClick={onClose} aria-label="닫기">✕</button>

        {phase === 'loading' && (
          <div className="story-loading">
            <span className="story-spinner" aria-hidden="true" />
            <p className="wr-muted">심사 서사를 불러오는 중이에요. 첫 조회는 몇 초 걸릴 수 있어요…</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="story-loading">
            <p className="auth-submit-error">{errorMsg}</p>
          </div>
        )}

        {phase === 'done' && story && (
          <div className="story-content">
            <div className="story-head">
              <div className="story-head-meta">
                {story.venue} {story.year} · <span className={isAccept(story.decision) ? 'wr-decision accept' : 'wr-decision'}>{story.decision}</span>
              </div>
              <h2 className="story-title">{story.title}</h2>
            </div>

            <JourneyBadge journey={story.journey} />

            {story.caveats?.length > 0 && (
              <div className="wr-banner story-caveats">
                {story.caveats.map((c, i) => <div key={i}>{c}</div>)}
              </div>
            )}

            <NarrativeCard narrative={story.narrative} />
            <Timeline events={story.timeline} supported={story.timeline_supported} />
          </div>
        )}
      </div>
    </div>
  );
}
