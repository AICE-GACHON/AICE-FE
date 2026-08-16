import OptionButton from '../OptionButton';
import { FIELD_OPTIONS, FIELD_MAX_SELECT, STAGE_OPTIONS, VENUE_OPTIONS } from '../onboardingData';

export default function StepCriteria({ answers, update }) {
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
      <h2>어떤 기준으로 논문을 분석할까요?</h2>
      <p className="onboard-desc">정확한 유사 논문과 리뷰를 찾기 위해 논문의 분야와 현재 단계를 알려주세요.</p>

      <h3 className="onboard-subq">주요 연구 분야를 선택해 주세요 (최대 {FIELD_MAX_SELECT}개)</h3>
      <div className="onboard-options">
        {FIELD_OPTIONS.map((opt) => {
          const selected = answers.fields.includes(opt.value);
          const atLimit = !selected && answers.fields.length >= FIELD_MAX_SELECT;
          return (
            <OptionButton
              key={opt.value}
              multi
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
          placeholder="연구 분야를 직접 입력해 주세요"
          value={answers.fieldCustom}
          onChange={(e) => update({ fieldCustom: e.target.value })}
        />
      )}

      <h3 className="onboard-subq" style={{ marginTop: 32 }}>논문은 현재 어느 단계인가요?</h3>
      <div className="onboard-options">
        {STAGE_OPTIONS.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={answers.stage === opt.value}
            onClick={() => update({ stage: opt.value })}
          />
        ))}
      </div>

      <h3 className="onboard-subq" style={{ marginTop: 32 }}>
        생각하고 있는 학회나 저널이 있나요? <span className="onboard-optional">(선택사항)</span>
      </h3>
      <div className="onboard-options">
        {VENUE_OPTIONS.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={answers.venue === opt.value}
            onClick={() => update({ venue: answers.venue === opt.value ? null : opt.value })}
          />
        ))}
      </div>
      {answers.venue === 'custom' && (
        <input
          type="text"
          className="onboard-input"
          placeholder="학회·저널명을 직접 입력해 주세요"
          value={answers.venueCustom}
          onChange={(e) => update({ venueCustom: e.target.value })}
        />
      )}
    </>
  );
}
