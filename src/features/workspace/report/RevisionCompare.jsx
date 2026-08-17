// "수정 전 → 최종본"을 두 칸으로 나란히 놓고, 달라진 부분만 형광펜으로 칠한다.
//
// 재료는 서버가 이미 주는 FieldChange.segments다 (op: equal | delete | insert).
//   왼쪽(수정 전)  = equal + delete  → delete를 **연한 회색**으로 (앞으로 사라질 부분)
//   오른쪽(최종본) = equal + insert  → insert를 **노란색**으로 (새로 들어온 부분)
// 즉 같은 세그먼트 목록을 두 번, 반대 방향으로 걸러 읽는 것뿐이라 두 칸이 어긋날 수 없다.

function Side({ segments, keep, mark, markClass }) {
  return (
    <p className="rc-text">
      {segments
        .filter((s) => s.op === 'equal' || s.op === keep)
        .map((s, i) => (
          s.op === mark
            ? <mark key={i} className={markClass}>{s.text}</mark>
            : <span key={i}>{s.text}</span>
        ))}
    </p>
  );
}

function FieldCompare({ change }) {
  // 세그먼트가 없으면(파일 교체 등) 나란히 비교할 게 없다 — 사실만 적는다.
  if (change.kind !== 'text' || !change.segments?.length) {
    return (
      <div className="rc-field">
        <div className="rc-field-label">{change.label}</div>
        <p className="wr-muted">
          {change.after === null ? '삭제됐습니다.' : '내용이 교체됐습니다 (본문 대조 불가).'}
        </p>
      </div>
    );
  }

  return (
    <div className="rc-field">
      <div className="rc-field-label">
        {change.label}
        {change.similarity != null && (
          <span className="wr-muted"> — 유사도 {change.similarity.toFixed(2)}</span>
        )}
      </div>
      <div className="rc-grid">
        <div className="rc-col">
          <div className="rc-col-head">
            수정 전 <span className="rc-legend rc-legend-before">사라질 부분</span>
          </div>
          <Side segments={change.segments} keep="delete" mark="delete" markClass="rc-mark-before" />
        </div>
        <div className="rc-col">
          <div className="rc-col-head">
            최종본 <span className="rc-legend rc-legend-after">새로 들어온 부분</span>
          </div>
          <Side segments={change.segments} keep="insert" mark="insert" markClass="rc-mark-after" />
        </div>
      </div>
    </div>
  );
}

/**
 * 타임라인의 author_revision 이벤트들에서 실제 수정본 하나를 골라 비교를 그린다.
 * baseline(관측 가능한 첫 버전)은 diff가 없으므로 건너뛴다.
 */
export default function RevisionCompare({ timeline }) {
  const revisions = (timeline || []).filter(
    (e) => e.kind === 'author_revision' && !e.is_baseline && e.changes?.length > 0,
  );

  if (revisions.length === 0) {
    return (
      <div className="wr-card">
        <div className="wr-card-title">✏️ 리뷰 전후 수정</div>
        {/* 수정이 없었다는 뜻이 아니다 — 본문 PDF 변경은 애초에 관측할 수 없다. */}
        <p className="wr-muted">
          제목·초록·첨부파일에서 확인된 수정이 없습니다. 논문 본문이 어떻게 바뀌었는지는
          PDF 안에 있어 알 수 없어요.
        </p>
      </div>
    );
  }

  // 여러 번 고친 논문은 마지막 수정을 대표로 보여준다 (중간본까지 늘어놓으면
  // "무엇이 최종인지"가 흐려진다).
  const latest = revisions[revisions.length - 1];

  return (
    <div className="wr-card">
      <div className="wr-card-title">✏️ 리뷰 전후 수정</div>
      <div className="wr-hint">
        {latest.date} 수정본 기준이에요.
        {revisions.length > 1 && ` (수정 ${revisions.length}회 중 마지막)`}
      </div>
      {latest.changes.map((c, i) => <FieldCompare key={i} change={c} />)}
    </div>
  );
}
