import OptionButton from '../OptionButton';
import { USER_TYPE_OPTIONS, EXPERIENCE_OPTIONS } from '../onboardingData';

export default function StepUserType({ answers, update }) {
  return (
    <>
      <h2>어떤 입장에서 논문을 다루고 있나요?</h2>
      <p className="onboard-desc">사용자의 상황에 맞게 분석 설명과 결과 구성을 조정해 드립니다.</p>

      <h3 className="onboard-subq">현재 어떤 목적으로 논문을 사용하고 있나요?</h3>
      <div className="onboard-options">
        {USER_TYPE_OPTIONS.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={answers.userType === opt.value}
            onClick={() => update({ userType: opt.value })}
          />
        ))}
      </div>

      <h3 className="onboard-subq" style={{ marginTop: 32 }}>논문 작성 또는 투고 경험은 어느 정도인가요?</h3>
      <div className="onboard-options">
        {EXPERIENCE_OPTIONS.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={answers.experience === opt.value}
            onClick={() => update({ experience: opt.value })}
          />
        ))}
      </div>
    </>
  );
}
