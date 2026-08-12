// PaperStoryPanel 왼쪽에 붙는 본문/그림/표 diff 패널.
// "심사 과정 보기" 클릭 한 번으로 오른쪽엔 기존 PaperStoryPanel(심사 서사),
// 왼쪽엔 이 패널(실제 본문이 리비전마다 어떻게 바뀌었는지)이 같이 뜬다.
//
// 렌더링 로직은 src/dev/BodyDiffTest.jsx(검증용 단독 페이지)와 bodyDiff.js를
// 공유한다 — 같은 문단·미디어 매칭 규칙을 두 곳에서 따로 구현하면 어긋나기 쉽다.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPaperRevisionsBodyDiff } from '../../api/papers';
import {
  MEDIA_KIND_LABELS, buildVersionBlocks, computeChangeGroups, summarizeChanges, versionLabel,
} from './bodyDiff';

const OP_CLASS = {
  insert: 'diff-ins', delete: 'diff-del', moved: 'diff-moved',
};
const OP_TITLE = {
  moved: '내용은 그대로, 위치만 이동됨',
};

function MediaImage({ media }) {
  if (media.single) {
    return media.before
      ? <img className="bodydiff-media-img" src={media.before} alt={media.label} />
      : <p className="wr-muted">이미지 없음</p>;
  }
  return (
    <div className="bodydiff-media-pair">
      <div className="bodydiff-media-slot">
        <div className="bodydiff-media-slot-label">수정 전</div>
        {media.before
          ? <img className="bodydiff-media-img" src={media.before} alt="" />
          : <p className="wr-muted">(없음 — 새로 추가됨)</p>}
      </div>
      <div className="bodydiff-media-slot">
        <div className="bodydiff-media-slot-label">수정 후</div>
        {media.after
          ? <img className="bodydiff-media-img" src={media.after} alt="" />
          : <p className="wr-muted">(없음 — 삭제됨)</p>}
      </div>
    </div>
  );
}

function MediaPiece({ piece, mediaByLabel, mediaByDeleted, changeIdx }) {
  const media = piece.op === 'delete' ? mediaByDeleted[piece.label] : mediaByLabel[piece.label];
  if (!media) return null; // 캡션은 있는데 크롭 실패한 드문 경우 — 조용히 생략
  return (
    <div className="bodydiff-media-block" data-change-idx={changeIdx >= 0 ? changeIdx : undefined}>
      <div className="bodydiff-media-title">
        {piece.label}
        {piece.op === 'moved' && <span className="diff-moved bodydiff-moved-badge">위치 이동됨</span>}
      </div>
      <MediaImage media={media} />
    </div>
  );
}

// "표 1"만 봐서는 추가된 건지 삭제된 건지 알 수 없다 — 개수가 1이든
// 여럿이든 항상 추가/삭제/이동으로 방향을 밝히고, 여러 종류가 섞였으면
// "/"로 구분한다.
function mediaChipLabel(kind, c) {
  const label = MEDIA_KIND_LABELS[kind] ?? kind;
  const parts = [];
  if (c.insert) parts.push(`추가${c.insert}`);
  if (c.delete) parts.push(`삭제${c.delete}`);
  if (c.moved) parts.push(`이동${c.moved}`);
  return `${label} ${parts.join(' / ')}`;
}

function ChangeSummary({ summary }) {
  const { text, media } = summary;
  const mediaEntries = Object.entries(media).filter(([, c]) => c.insert + c.delete + c.moved > 0);
  const hasAny = text.insert || text.delete || text.moved || mediaEntries.length > 0;
  if (!hasAny) {
    return <p className="wr-muted bodydiff-summary-empty">이 버전에서 감지된 변경이 없어요.</p>;
  }
  return (
    <div className="bodydiff-summary">
      {text.insert > 0 && <span className="bodydiff-legend-item"><span className="diff-ins">추가 {text.insert}</span></span>}
      {text.delete > 0 && <span className="bodydiff-legend-item"><span className="diff-del">삭제 {text.delete}</span></span>}
      {text.moved > 0 && <span className="bodydiff-legend-item"><span className="diff-moved">이동 {text.moved}</span></span>}
      {mediaEntries.map(([kind, c]) => (
        <span key={kind} className="bodydiff-legend-item">
          <span className="diff-media">{mediaChipLabel(kind, c)}</span>
        </span>
      ))}
    </div>
  );
}

function VersionText({ block }) {
  if (block.text == null) {
    if (block.noPdfChange) {
      return (
        <p className="wr-muted">
          메타데이터만 고쳤어요. PDF 본문은 변경사항이 없습니다.
        </p>
      );
    }
    return <p className="bodydiff-warn">이 버전은 본문을 비교할 수 없어요 (다운로드 실패·스캔본·페이지 상한 등).</p>;
  }
  const { pieces, groupIndexOfPiece } = computeChangeGroups(block);
  return (
    <div className="bodydiff-text">
      {pieces.map((p, i) => {
        const changeIdx = groupIndexOfPiece[i];
        return p.kind === 'text'
          ? (
            <span
              key={i}
              className={OP_CLASS[p.op]}
              title={OP_TITLE[p.op]}
              data-change-idx={changeIdx >= 0 ? changeIdx : undefined}
            >{p.text}</span>
          )
          : (
            <MediaPiece
              key={i}
              piece={p}
              mediaByLabel={block.mediaByLabel}
              mediaByDeleted={block.mediaByDeleted}
              changeIdx={changeIdx}
            />
          );
      })}
    </div>
  );
}

// layout='modal': PaperStoryPanel의 오버레이 왼쪽에 붙는 형태 — 고정 높이,
// 자체 스크롤, 999px 이하에서 숨김(모달은 좁은 화면에서 오른쪽 패널만으로도
// 충분하다고 판단).
// layout='inline': PaperDetail처럼 페이지 안에 카드 하나로 놓이는 형태 —
// 높이를 페이지 흐름에 맡기고, 좁은 화면에서도 숨기지 않는다(메인 콘텐츠라
// 숨기면 기능 자체가 사라진다). bodyDiff.js 계산 로직·마크업은 완전히 같다.
export default function BodyDiffPanel({ paperId, layout = 'modal' }) {
  const [phase, setPhase] = useState('loading'); // loading | done | error
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selected, setSelected] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [fullViewOpen, setFullViewOpen] = useState(false);
  const scrollRef = useRef(null);
  const fullViewScrollRef = useRef(null);
  const savedScrollTopRef = useRef(0);

  useEffect(() => {
    // paperId가 바뀌면 부모(PaperStoryPanel)가 key={paperId}로 통째로 다시
    // 마운트되므로(PaperStoryPanel.jsx 참고), 여기서 로딩 상태로 되돌릴 필요
    // 없이 이번 paperId에 대한 요청만 신경 쓰면 된다 — 초기값이 이미 'loading'이다.
    let cancelled = false;
    getPaperRevisionsBodyDiff(paperId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setPhase('done');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '본문 비교를 불러오지 못했어요.');
        setPhase('error');
      });
    return () => { cancelled = true; };
  }, [paperId]);

  const versionBlocks = useMemo(
    () => (data?.revisions ? buildVersionBlocks(data.revisions) : []),
    [data],
  );
  const current = versionBlocks[selected];
  const summary = useMemo(() => (selected > 0 && current ? summarizeChanges(current) : null), [selected, current]);
  const changeCount = useMemo(
    () => (selected > 0 && current ? computeChangeGroups(current).groups.length : 0),
    [selected, current],
  );

  // 버전을 바꾸면 그 버전의 변경 목록도 처음(아직 아무 데도 안 가본 상태)부터
  // 다시 훑어야 하니 -1로 되돌린다 — "N / M" 표시는 changePos+1로 계산한다.
  // effect 대신 렌더 중에 조건부로 리셋한다(React가 권장하는 "prop이 바뀌면
  // state를 되돌리는" 패턴 — PaperStoryPanel.jsx의 key={paperId} 리마운트와
  // 달리 selected는 이 컴포넌트 내부 state라 리마운트로 해결할 수 없다).
  const [changePos, setChangePos] = useState(-1);
  const [changePosVersion, setChangePosVersion] = useState(selected);
  if (selected !== changePosVersion) {
    setChangePosVersion(selected);
    setChangePos(-1);
  }

  // 업데이터 함수는 다음 위치 번호만 계산하는 순수 함수로 둔다(StrictMode가
  // 개발 모드에서 이 함수를 두 번 호출하므로, 여기서 스크롤 같은 부수효과를
  // 하면 두 번 실행된다) — 실제 스크롤 이동은 changePos가 바뀐 뒤 아래
  // effect에서 한다.
  const goPrevChange = () => setChangePos((prev) => (prev <= 0 ? changeCount - 1 : prev - 1));
  const goNextChange = () => setChangePos((prev) => (prev < 0 || prev >= changeCount - 1 ? 0 : prev + 1));

  const openFullView = () => {
    savedScrollTopRef.current = scrollRef.current?.scrollTop || 0;
    setFullViewOpen(true);
  };

  const closeFullView = () => {
    savedScrollTopRef.current = fullViewScrollRef.current?.scrollTop || savedScrollTopRef.current;
    setFullViewOpen(false);
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = savedScrollTopRef.current;
    });
  };

  useEffect(() => {
    if (!fullViewOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => {
      if (fullViewScrollRef.current) {
        fullViewScrollRef.current.scrollTop = savedScrollTopRef.current;
      }
    });
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeFullView();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullViewOpen]);

  useEffect(() => {
    if (changePos < 0) return undefined;
    const scrollContainer = fullViewOpen ? fullViewScrollRef.current : scrollRef.current;
    const target = scrollContainer?.querySelector(`[data-change-idx="${changePos}"]`);
    if (!scrollContainer || !target) return undefined;

    // scrollIntoView는 페이지까지 함께 움직일 수 있다. 변경 이동은 논문 본문
    // 스크롤 안에서만 처리해 오른쪽 리뷰의 현재 위치를 그대로 보존한다.
    const containerRect = scrollContainer.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = scrollContainer.scrollTop
      + targetRect.top
      - containerRect.top
      - (scrollContainer.clientHeight - targetRect.height) / 2;
    scrollContainer.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    target.classList.add('bodydiff-change-focus');
    const timer = setTimeout(() => target.classList.remove('bodydiff-change-focus'), 1200);
    return () => {
      clearTimeout(timer);
      target.classList.remove('bodydiff-change-focus');
    };
  }, [changePos, fullViewOpen]);

  const panelClass = layout === 'inline' ? 'bodydiff-panel bodydiff-panel--inline' : 'bodydiff-panel';
  return (
    <div className={panelClass} onClick={(e) => e.stopPropagation()}>
      {/* 콜아웃 + 버전 탭은 스크롤 밖(항상 보임) — 실제로 길어서 스크롤이
          필요한 건 아래 본문 텍스트뿐이다. */}
      <div className="bodydiff-head">
        <div className="bodydiff-head-row">
          <div className="bodydiff-head-title">본문 변경 이력</div>
          <button
            type="button"
            className="bodydiff-guide-toggle"
            aria-expanded={guideOpen}
            onClick={() => setGuideOpen((open) => !open)}
          >
            {guideOpen ? '안내 접기' : '분석 안내 보기'}
          </button>
        </div>
        {guideOpen && (
          <div className="bodydiff-callout">
            <p>논문 수정 버전마다 문장·그림·표·알고리즘·수식이 어떻게 달라졌는지
              자동으로 비교해 보여줍니다.</p>
            <p>분석은 OpenReview에 공개된 수정 버전을 기준으로 하며, 자동 분석
              특성상 일부 변경 사항이 정확히 감지되지 않을 수 있습니다.{' '}
              <b>특히 표·수식·그림은 PDF 내 위치를 기반으로 비교하므로 오차가
              발생할 수 있습니다.</b> 결과가 이상하거나 세부 확인이 필요한 경우,
              각 버전의 <b>PDF 원문</b>을 직접 확인해 주세요.</p>
          </div>
        )}
      </div>

      {phase === 'loading' && (
        <div className="story-loading">
          <span className="story-spinner" aria-hidden="true" />
          <p className="wr-muted">본문 변경 이력을 불러오는 중이에요. 첫 조회는 몇 초 걸릴 수 있어요…</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="story-loading">
          <p className="auth-submit-error">{errorMsg}</p>
        </div>
      )}

      {phase === 'done' && data && !data.supported && (
        <p className="wr-muted">{data.message || '이 논문은 본문 수정 이력을 확인할 수 없어요.'}</p>
      )}

      {phase === 'done' && data?.supported && versionBlocks.length === 0 && (
        <p className="wr-muted">이 논문은 제출된 뒤로 한 번도 수정되지 않았어요.</p>
      )}

      {phase === 'done' && versionBlocks.length > 0 && (
        <>
          <div className="bodydiff-timeline">
            {versionBlocks.map((b, i) => (
              <button
                key={i}
                type="button"
                className={`bodydiff-version-btn${i === selected ? ' is-active' : ''}`}
                onClick={() => setSelected(i)}
              >
                <div className="bodydiff-version-no">{versionLabel(i + 1, versionBlocks.length)}</div>
                <div className="bodydiff-version-meta">{b.label} · {b.date}</div>
              </button>
            ))}
          </div>

          {current && (
            <div className="bodydiff-body">
              <div className="bodydiff-body-head">
                <div className="bodydiff-body-head-left">
                  <div>
                    <span className="bodydiff-body-head-title">{versionLabel(selected + 1, versionBlocks.length)}</span>
                    <span className="wr-muted"> · {current.label} · {current.date}</span>
                  </div>

                  {/* 이 diff가 못 미더울 때를 위한 보험 — 실제 PDF 원문을 새 탭에서
                      바로 열어 눈으로 대조할 수 있게 한다. */}
                  {(current.pdfLinks?.beforeUrl || current.pdfLinks?.afterUrl) && (
                    <div className="bodydiff-pdf-links">
                      {current.pdfLinks.beforeUrl && (
                        <a className="bodydiff-pdf-link" href={current.pdfLinks.beforeUrl} target="_blank" rel="noopener noreferrer">
                          {versionLabel(selected, versionBlocks.length)} PDF 원문 ↗
                        </a>
                      )}
                      {current.pdfLinks.afterUrl && (
                        <a className="bodydiff-pdf-link" href={current.pdfLinks.afterUrl} target="_blank" rel="noopener noreferrer">
                          {current.noPdfChange
                            ? '현재 PDF 원문 (이 버전에서는 안 바뀜) ↗'
                            : `${versionLabel(selected + 1, versionBlocks.length)} PDF 원문 ↗`}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="bodydiff-body-tools">
                  {summary && <ChangeSummary summary={summary} />}
                  <button type="button" className="bodydiff-fullview-open" onClick={openFullView}>
                    ⛶ 크게 보기
                  </button>
                </div>
              </div>

              {/* 버전 헤더·PDF 링크·범례·요약은 늘 보이고, 실제로 길어서
                  스크롤이 필요한 diff 본문만 이 안에서 스크롤한다. */}
              <div className="bodydiff-scroll" ref={scrollRef}>
                <VersionText block={current} />
              </div>
            </div>
          )}
        </>
      )}

      {changeCount > 0 && (
        <div className="bodydiff-change-nav" aria-label="변경 위치 이동">
          <button type="button" className="bodydiff-change-nav-btn" onClick={goPrevChange}>◀ 이전 변경</button>
          <span className="bodydiff-change-nav-pos">{changePos >= 0 ? changePos + 1 : '-'} / {changeCount}</span>
          <button type="button" className="bodydiff-change-nav-btn" onClick={goNextChange}>다음 변경 ▶</button>
        </div>
      )}

      {fullViewOpen && current && createPortal((
        <div className="bodydiff-fullview-backdrop" role="presentation" onMouseDown={closeFullView}>
          <section
            className="bodydiff-fullview"
            role="dialog"
            aria-modal="true"
            aria-label={`${versionLabel(selected + 1, versionBlocks.length)} 본문 크게 보기`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="bodydiff-fullview-head">
              <div className="bodydiff-body-head-left">
                <div>
                  <span className="bodydiff-body-head-title">{versionLabel(selected + 1, versionBlocks.length)}</span>
                  <span className="wr-muted"> · {current.label} · {current.date}</span>
                </div>
                {(current.pdfLinks?.beforeUrl || current.pdfLinks?.afterUrl) && (
                  <div className="bodydiff-pdf-links">
                    {current.pdfLinks.beforeUrl && (
                      <a className="bodydiff-pdf-link" href={current.pdfLinks.beforeUrl} target="_blank" rel="noopener noreferrer">
                        {versionLabel(selected, versionBlocks.length)} PDF 원문 ↗
                      </a>
                    )}
                    {current.pdfLinks.afterUrl && (
                      <a className="bodydiff-pdf-link" href={current.pdfLinks.afterUrl} target="_blank" rel="noopener noreferrer">
                        {current.noPdfChange
                          ? '현재 PDF 원문 (이 버전에서는 안 바뀜) ↗'
                          : `${versionLabel(selected + 1, versionBlocks.length)} PDF 원문 ↗`}
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="bodydiff-fullview-head-actions">
                {summary && <ChangeSummary summary={summary} />}
                <button type="button" className="bodydiff-fullview-close" onClick={closeFullView} aria-label="크게 보기 닫기">×</button>
              </div>
            </header>

            <div className="bodydiff-fullview-scroll" ref={fullViewScrollRef}>
              <VersionText block={current} />
            </div>

            {changeCount > 0 && (
              <div className="bodydiff-change-nav bodydiff-fullview-nav" aria-label="변경 위치 이동">
                <button type="button" className="bodydiff-change-nav-btn" onClick={goPrevChange}>◀ 이전 변경</button>
                <span className="bodydiff-change-nav-pos">{changePos >= 0 ? changePos + 1 : '-'} / {changeCount}</span>
                <button type="button" className="bodydiff-change-nav-btn" onClick={goNextChange}>다음 변경 ▶</button>
              </div>
            )}
          </section>
        </div>
      ), document.body)}
    </div>
  );
}
