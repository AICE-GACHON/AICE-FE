import { similarityFocusLabel, recencyBiasLabel } from '../../onboarding/onboardingData';

// 이 분석이 **무엇을 우선해서** 골랐는지 한 줄.
//
// 없으면 온보딩 2단계 답변이 반영됐는지 사용자가 알 방법이 전혀 없다. 특히
// recency_bias는 효과가 미묘해서(연도 분포가 바뀔 뿐 목록이 통째로 달라지지는
// 않는다) 표시가 없으면 "아무것도 안 바뀌었다"로 읽힌다.
//
// ⚠️ 값의 출처는 **report.preferences**다 — 온보딩 스토어가 아니다. 그 둘은
// 갈릴 수 있고, 갈릴 때 맞는 쪽은 report다: 분석은 그때의 답으로 돌았고,
// 사용자가 마이페이지에서 답을 바꿔도 이미 끝난 분석은 그대로다. 온보딩 쪽을
// 읽으면 지난 결과에 지금의 답을 덧씌워 설명하게 된다.
//
// 둘 다 '균형있게'(=기본값, 온보딩을 건너뛴 경우 포함)면 아무것도 그리지 않는다.
// "균형있게 골랐어요"는 모든 결과에 붙는 문장이라 정보가 0이다.
export default function AppliedPreferences({ preferences }) {
  if (!preferences) return null;

  const chips = [
    similarityFocusLabel(pick(preferences.similarity_focus)),
    recencyBiasLabel(pick(preferences.recency_bias)),
  ].filter(Boolean);

  if (chips.length === 0) return null;

  return (
    <div className="rp-prefs">
      <span className="mono-label">PRIORITISED</span>
      {chips.map((label) => (
        <span key={label} className="rp-prefs-chip">{label}</span>
      ))}
      <span className="rp-prefs-tail">위주로 골랐어요</span>
    </div>
  );
}

// 'balanced'와 미지정을 같은 것으로 본다 (백엔드 규약과 같다 — 값이 없다는 것
// 자체가 "균형있게"라서 별도 sentinel을 두지 않는다).
function pick(value) {
  return value && value !== 'balanced' ? value : null;
}
