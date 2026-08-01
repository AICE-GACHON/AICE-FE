import OptionButton from '../OptionButton';
import { PURPOSE_OPTIONS, PURPOSE_MAX_SELECT } from '../onboardingData';

export default function StepPurpose({ answers, update }) {
  const toggle = (value) => {
    const has = answers.purposes.includes(value);
    if (has) {
      update({ purposes: answers.purposes.filter((v) => v !== value) });
      return;
    }
    if (answers.purposes.length >= PURPOSE_MAX_SELECT) return;
    update({ purposes: [...answers.purposes, value] });
  };

  return (
    <>
      <h2>지금 가장 필요한 도움은 무엇인가요?</h2>
      <p className="onboard-desc">
        선택한 목적에 따라 분석 결과의 우선순위를 조정합니다. 최대 {PURPOSE_MAX_SELECT}개까지 선택할 수 있어요.
      </p>

      <div className="onboard-options" style={{ marginTop: 20 }}>
        {PURPOSE_OPTIONS.map((opt) => {
          const selected = answers.purposes.includes(opt.value);
          const atLimit = !selected && answers.purposes.length >= PURPOSE_MAX_SELECT;
          return (
            <OptionButton
              key={opt.value}
              multi
              label={opt.label}
              desc={opt.desc}
              selected={selected}
              disabled={atLimit}
              onClick={() => toggle(opt.value)}
            />
          );
        })}
      </div>
    </>
  );
}
