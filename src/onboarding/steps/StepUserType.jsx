import OptionButton from '../OptionButton';
import { USER_TYPE_OPTIONS, FIELD_OPTIONS, FIELD_MAX_SELECT } from '../onboardingData';

export default function StepUserType({ answers, update }) {
  const toggleField = (value) => {
    const has = answers.fields.includes(value);
    if (has) {
      update({ fields: answers.fields.filter((v) => v !== value) });
      return;
    }
    if (answers.fields.length >= FIELD_MAX_SELECT) return;
    update({ fields: [...answers.fields, value] });
  };

  return (
    <>
      <h2>회원님에 대해 알려주세요</h2>
      <p className="onboard-desc" style={{ whiteSpace: 'nowrap' }}>회원님의 상황을 프로필로 저장해 둬요. 나중에 맞춤 기능을 준비할 때 참고할게요.</p>

      <h3 className="onboard-subq" style={{ marginTop: 28 }}>현재 논문과 관련해 어떤 역할을 맡고 계시나요?</h3>
      <div className="onboard-options">
        {USER_TYPE_OPTIONS.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={answers.userType === opt.value}
            onClick={() => update({ userType: answers.userType === opt.value ? null : opt.value })}
          />
        ))}
      </div>

      <h3 className="onboard-subq" style={{ marginTop: 32 }}>
        관심 있는 전공 분야는 무엇인가요? <span className="onboard-optional">최대 {FIELD_MAX_SELECT}개</span>
      </h3>
      <div className="onboard-options">
        {FIELD_OPTIONS.map((opt) => {
          const selected = answers.fields.includes(opt.value);
          const atLimit = !selected && answers.fields.length >= FIELD_MAX_SELECT;
          return (
            <OptionButton
              key={opt.value}
              multi
              round
              label={opt.label}
              selected={selected}
              disabled={atLimit}
              onClick={() => toggleField(opt.value)}
            />
          );
        })}
      </div>
      {answers.fields.includes('custom') && (
        <input
          type="text"
          className="onboard-input"
          placeholder="전공 분야를 직접 입력해 주세요"
          value={answers.fieldCustom}
          onChange={(e) => update({ fieldCustom: e.target.value })}
        />
      )}
    </>
  );
}
