import OptionButton from '../OptionButton';
import { SIMILARITY_FOCUS_OPTIONS, RECENCY_BIAS_OPTIONS } from '../onboardingData';

export default function StepPurpose({ answers, update }) {
  return (
    <>
      <h2>유사 논문을 고를 때 뭘 우선할까요?</h2>
      <p className="onboard-desc">검색에서 참고하는 기준이에요. 건너뛰면 균형있게로 기본 설정돼요.</p>

      <h3 className="onboard-subq" style={{ marginTop: 28 }}>어떤 면이 비슷하면 더 눈여겨볼까요?</h3>
      <div className="onboard-options">
        {SIMILARITY_FOCUS_OPTIONS.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            desc={opt.desc}
            selected={answers.similarityFocus === opt.value}
            onClick={() => update({ similarityFocus: answers.similarityFocus === opt.value ? null : opt.value })}
          />
        ))}
      </div>

      <h3 className="onboard-subq" style={{ marginTop: 28 }}>최신 논문과 인용이 많은 논문, 뭘 우선할까요?</h3>
      <div className="onboard-options">
        {RECENCY_BIAS_OPTIONS.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={answers.recencyBias === opt.value}
            onClick={() => update({ recencyBias: answers.recencyBias === opt.value ? null : opt.value })}
          />
        ))}
      </div>
    </>
  );
}
