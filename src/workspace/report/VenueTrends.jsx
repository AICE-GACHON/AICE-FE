// AI 파트 4대 규칙 #4: is_coverage_biased가 true인 학회는 채택률 절대 수치를 노출하지 않는다.
// NeurIPS는 코퍼스의 95%가 accept로 보이지만 실제 채택률은 ~25% (OpenReview가 채택작 위주로만 공개돼서).
export default function VenueTrends({ trends, flows }) {
  return (
    <div className="wr-card">
      <div className="wr-card-title">🏛️ 게재 경향</div>
      {trends.length === 0 && <div className="wr-muted">데이터 없음.</div>}
      {trends.map((t) => (
        <div key={t.venue} className="wr-venue">
          {t.is_coverage_biased ? (
            <>
              <div className="wr-bar-row">
                <span className="wr-bar-label">
                  {t.venue}
                  <span className="wr-split-badge" title="OpenReview에 채택 논문 위주로만 공개되어 절대 채택률을 표시하지 않습니다.">표본편향</span>
                </span>
                <span className="wr-bar-count">{t.paper_count}편</span>
              </div>
              {t.accept_lift != null && (
                <div className="wr-ex">
                  이 학회 코퍼스 평균 대비 <b>{t.accept_lift.toFixed(2)}배</b> — 절대 채택률로 읽지 말 것
                </div>
              )}
            </>
          ) : (
            <>
              <div className="wr-bar-row">
                <span className="wr-bar-label">{t.venue}</span>
                <span className="wr-bar-track">
                  <span className="wr-bar-fill wr-bar-fill-accept" style={{ width: `${(100 * t.accept_rate).toFixed(0)}%` }} />
                </span>
                <span className="wr-bar-count">{t.accept_count}/{t.paper_count} ({(100 * t.accept_rate).toFixed(0)}%)</span>
              </div>
              {t.accept_lift != null && (
                <div className="wr-ex">
                  이 학회 코퍼스 평균 {t.corpus_accept_rate != null ? `${(100 * t.corpus_accept_rate).toFixed(0)}%` : ''} 대비 <b>{t.accept_lift.toFixed(2)}배</b>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {flows?.length > 0 && (
        <div className="wr-flows">
          <div className="wr-muted" style={{ marginBottom: 6 }}>재투고 흐름</div>
          {flows.map((f, i) => (
            <div key={i} className="wr-flow">
              {f.from_venue} <span className="wr-arrow">→</span> {f.to_venue} <span className="wr-muted">{f.count}건</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
