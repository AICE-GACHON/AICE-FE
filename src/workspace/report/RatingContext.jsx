export default function RatingContext({ rc }) {
  if (!rc || !rc.rated_papers) return null;

  return (
    <div className="wr-card">
      <div className="wr-card-title">📊 리뷰 점수</div>
      <div>
        유사 논문 {rc.rated_papers}편의 평균 <b>{rc.neighbor_mean}점</b>
        {rc.accepted_mean != null && rc.rejected_mean != null && (
          <> — 통과한 논문 {rc.accepted_mean}점 vs 탈락한 논문 {rc.rejected_mean}점</>
        )}
      </div>
      {rc.threshold != null && (
        <div style={{ marginTop: 6 }}>
          당락 경계: <b>{rc.threshold_venue}</b> 기준 평균 <b>{rc.threshold}점</b> 이상이면 통과율 50%를 넘습니다.
        </div>
      )}
      {rc.split_papers?.length > 0 && (
        <div className="wr-ex" style={{ marginTop: 8 }}>
          리뷰어 의견이 크게 갈린 논문: {rc.split_papers.join(' · ')}
        </div>
      )}
      {rc.biased_venues?.length > 0 && (
        <div className="wr-banner" style={{ marginTop: 10 }}>
          ⚠️ {rc.biased_venues.join(', ')}는 OpenReview에 <b>채택된 논문 위주로만</b> 공개됩니다.
          이 학회의 accept율을 실제 채택률로 해석하지 마세요.
        </div>
      )}
    </div>
  );
}
