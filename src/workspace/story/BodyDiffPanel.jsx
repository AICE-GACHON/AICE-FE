// PaperStoryPanel 왼쪽에 붙는 본문/그림/표 diff 패널.
// "심사 과정 보기" 클릭 한 번으로 오른쪽엔 기존 PaperStoryPanel(심사 서사),
// 왼쪽엔 이 패널(실제 본문이 리비전마다 어떻게 바뀌었는지)이 같이 뜬다.
//
// 렌더링 로직은 src/dev/BodyDiffTest.jsx(검증용 단독 페이지)와 bodyDiff.js를
// 공유한다 — 같은 문단·미디어 매칭 규칙을 두 곳에서 따로 구현하면 어긋나기 쉽다.
import { useEffect, useMemo, useState } from 'react';
import { getPaperRevisionsBodyDiff } from '../../api/papers';
import { buildVersionBlocks, splitSegmentsWithMedia, withSpacing } from './bodyDiff';

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

function MediaPiece({ piece, mediaByLabel, mediaByDeleted }) {
  const media = piece.op === 'delete' ? mediaByDeleted[piece.label] : mediaByLabel[piece.label];
  if (!media) return null; // 캡션은 있는데 크롭 실패한 드문 경우 — 조용히 생략
  return (
    <div className="bodydiff-media-block">
      <div className="bodydiff-media-title">
        {piece.label}
        {piece.op === 'moved' && <span className="diff-moved bodydiff-moved-badge">위치 이동됨</span>}
      </div>
      <MediaImage media={media} />
    </div>
  );
}

function VersionText({ block }) {
  if (block.text == null) {
    return <p className="bodydiff-warn">이 버전은 본문을 비교할 수 없어요 (다운로드 실패·스캔본·페이지 상한 등).</p>;
  }
  const segs = block.segments ? withSpacing(block.segments) : [{ op: 'equal', text: block.text }];
  const pieces = splitSegmentsWithMedia(segs);
  return (
    <div className="bodydiff-text">
      {pieces.map((p, i) => (
        p.kind === 'text'
          ? <span key={i} className={OP_CLASS[p.op]} title={OP_TITLE[p.op]}>{p.text}</span>
          : <MediaPiece key={i} piece={p} mediaByLabel={block.mediaByLabel} mediaByDeleted={block.mediaByDeleted} />
      ))}
    </div>
  );
}

export default function BodyDiffPanel({ paperId }) {
  const [phase, setPhase] = useState('loading'); // loading | done | error
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selected, setSelected] = useState(0);

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

  return (
    <div className="bodydiff-panel" onClick={(e) => e.stopPropagation()}>
      <div className="bodydiff-head">
        <div className="bodydiff-head-title">📄 본문 변경 이력</div>
        <div className="wr-hint">리비전마다 문장·그림·표·알고리즘·수식이 실제로 어떻게 바뀌었는지 보여줘요.</div>
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
        <p className="wr-muted">공개된 리비전이 없어요.</p>
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
                <div className="bodydiff-version-no">v{i + 1}{i === 0 && ' (수정 전 원문)'}</div>
                <div className="bodydiff-version-meta">{b.label} · {b.date}</div>
              </button>
            ))}
          </div>

          {current && (
            <div className="bodydiff-body">
              <div className="bodydiff-body-head">
                v{selected + 1} · {current.label} · {current.date}
                {selected > 0 && <span className="wr-muted"> — 이전 버전 대비 변경(초록=추가, 빨강=삭제)</span>}
              </div>

              {/* 이 diff가 못 미더울 때를 위한 보험 — 실제 PDF 원문을 새 탭에서
                  바로 열어 눈으로 대조할 수 있게 한다. */}
              {(current.pdfLinks?.beforeUrl || current.pdfLinks?.afterUrl) && (
                <div className="bodydiff-pdf-links">
                  {current.pdfLinks.beforeUrl && (
                    <a href={current.pdfLinks.beforeUrl} target="_blank" rel="noopener noreferrer">
                      v{selected} 원문 PDF 열기 ↗
                    </a>
                  )}
                  {current.pdfLinks.afterUrl && (
                    <a href={current.pdfLinks.afterUrl} target="_blank" rel="noopener noreferrer">
                      v{selected + 1} 원문 PDF 열기 ↗
                    </a>
                  )}
                </div>
              )}

              <VersionText block={current} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
