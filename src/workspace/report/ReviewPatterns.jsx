// AI 파트 4대 규칙 #3: 빈도순이 아니라 is_distinctive(코퍼스 대비 두드러짐) 기준으로 강조한다.
// baselines 지적은 코퍼스의 78.8%가 받아서 "20편 중 17편"은 정보량이 0이다 (DEVELOPMENT.md §6).
export default function ReviewPatterns({ patterns, neighborCount }) {
  const denom = patterns[0]?.total_papers;
  const hasLift = patterns.some((p) => p.lift != null);
  const noneDistinctive = hasLift && !patterns.some((p) => p.is_distinctive);

  return (
    <div className="wr-card">
      <div className="wr-card-title">💬 반복되는 리뷰 지적</div>
      {patterns.length === 0 && (
        <div className="wr-muted">지적 패턴 데이터가 아직 없습니다 (수집 진행 중일 수 있음).</div>
      )}
      {denom != null && neighborCount != null && denom < neighborCount && (
        <div className="wr-muted" style={{ marginBottom: 10 }}>
          유사 논문 {neighborCount}편 중 <b>{denom}편</b> 기준 — 나머지는 강·약점을 나누지 않는 리뷰 형식이라
          지적을 확정할 수 없어 제외했습니다.
        </div>
      )}
      {noneDistinctive && (
        <div className="wr-muted" style={{ marginBottom: 10 }}>
          이 주제 특유의 지적은 없습니다 — 아래는 모두 ML 논문 전반의 평균적인 지적 수준입니다.
        </div>
      )}
      {patterns.map((p) => {
        const width = ((100 * p.paper_count) / p.total_papers).toFixed(0);
        let liftNote = null;
        if (p.lift != null) {
          let note = '';
          if (!p.is_distinctive) {
            note = p.lift >= 1.25 ? ` — 표본이 작아 판단 보류 (p=${p.p_value})` : ' — 평균 수준';
          }
          liftNote = `코퍼스 평균 ${(100 * p.base_rate).toFixed(0)}% 대비 ${p.lift.toFixed(2)}배${note}`;
        }
        return (
          <div key={p.label} className="wr-pattern">
            <div className="wr-bar-row">
              <span className="wr-bar-label">
                {p.is_distinctive && <span className="wr-star" title="코퍼스 평균 대비 유의하게 높음">★</span>} {p.label}
              </span>
              <span className="wr-bar-track"><span className="wr-bar-fill" style={{ width: `${width}%` }} /></span>
              <span className="wr-bar-count">{p.paper_count}/{p.total_papers}편</span>
            </div>
            {liftNote && <div className="wr-ex">{liftNote}</div>}
            {p.is_contrast_significant && (
              <div className="wr-ex wr-ex-risk">
                이 지적을 받은 {p.decided_with}편 중 {p.accept_with}편만 통과({(100 * p.accept_rate_with).toFixed(0)}%) ·
                지적이 없던 {p.decided_without}편은 {(100 * p.accept_rate_without).toFixed(0)}% 통과
              </div>
            )}
            {/* examples는 문자열이 아니라 ReviewExample 객체다 (schemas.py ReviewExample:
                text/paper_id/review_point_id/from_unsplit_review). 객체를 그대로 렌더하면
                React가 트리 전체를 언마운트시켜 화면이 백지가 된다. */}
            {p.examples?.[0]?.text && <div className="wr-ex">예: {p.examples[0].text}</div>}
          </div>
        );
      })}
    </div>
  );
}
