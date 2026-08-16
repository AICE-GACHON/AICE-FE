// author_revision.changes[]는 GET /api/papers/{id}/revisions의 FieldChange와 동일 구조.
function ChangeBlock({ change }) {
  if (change.kind === 'text' && change.segments?.length > 0) {
    return (
      <div className="story-change-text">
        {change.segments.map((s, i) => (
          <span key={i} className={s.op === 'insert' ? 'diff-ins' : s.op === 'delete' ? 'diff-del' : undefined}>
            {s.text}
          </span>
        ))}
      </div>
    );
  }
  if (change.kind === 'file') {
    return (
      <div className="story-change-file">
        {change.after === null ? '삭제됨' : change.after}
        {change.before_url && <a href={change.before_url} target="_blank" rel="noopener noreferrer">이전본 ↗</a>}
        {change.after_url && <a href={change.after_url} target="_blank" rel="noopener noreferrer">이후본 ↗</a>}
      </div>
    );
  }
  // kind === 'value'
  return (
    <div className="story-change-value">
      {change.after === null
        ? '삭제됨'
        : change.before
          ? <><span className="diff-del">{change.before}</span> → <span className="diff-ins">{change.after}</span></>
          : change.after}
    </div>
  );
}

export default function RevisionDiff({ changes, isBaseline }) {
  // is_baseline=true는 "수정이 없었다"가 아니라 "관측 가능한 첫 버전이라 diff가 없다"는 뜻.
  if (isBaseline) {
    return <p className="wr-muted">여기서부터 이력이 공개됩니다 (이전 내용은 비공개).</p>;
  }
  if (!changes?.length) {
    return <p className="wr-muted">추적 대상 필드(제목·초록·PDF 등)에는 변경이 없습니다.</p>;
  }
  return (
    <div className="story-changes">
      {changes.map((c, i) => (
        <div key={i} className="story-change">
          <div className="story-change-label">
            {c.label}
            {c.kind === 'text' && c.similarity != null && <span className="wr-muted"> — 유사도 {c.similarity.toFixed(2)}</span>}
          </div>
          <ChangeBlock change={c} />
        </div>
      ))}
    </div>
  );
}
