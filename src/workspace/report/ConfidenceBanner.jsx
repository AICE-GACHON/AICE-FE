// AI 파트 4대 규칙 #2: confidence.level이 strong이 아니면 결과 위에 경고를 띄운다.
// (DEVELOPMENT.md §6, AI_파트_팀_공유.md §4)
export default function ConfidenceBanner({ confidence }) {
  if (!confidence || confidence.level === 'strong') return null;
  const danger = !confidence.is_reliable;
  return (
    <div className={`wr-banner${danger ? ' wr-banner-danger' : ''}`}>
      <span aria-hidden="true">{danger ? '⚠️' : 'ℹ️'}</span> {confidence.message}
    </div>
  );
}
