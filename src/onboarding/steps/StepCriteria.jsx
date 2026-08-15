import OptionButton from '../OptionButton';
import { VENUE_OPTIONS } from '../onboardingData';

// 관심 분야·진행 단계 질문은 뺐다 — 실제 분석 결과에 반영되지 않는 값이었다
// (분야는 코퍼스에 태그가 없어 검색에 못 쓰고, 단계는 어디에도 안 쓰였다).
// 목표 학회(venue)만 남긴다 — 코퍼스를 다른 학회로 확장할 계획이 있어서다.
export default function StepCriteria({ answers, update }) {
  const toggleVenue = (value) => {
    const has = answers.venues.includes(value);
    update({
      venues: has ? answers.venues.filter((v) => v !== value) : [...answers.venues, value],
    });
  };

  return (
    <>
      <h2>어느 학회·저널을 목표로 하고 있나요?</h2>
      <p className="onboard-desc" style={{ whiteSpace: 'nowrap' }}>유사 논문을 찾을 때 목표 학회 논문이 검색 결과에 뽑힐 확률을 살짝 높여드려요.</p>

      <div className="onboard-options" style={{ marginTop: 28 }}>
        {VENUE_OPTIONS.map((opt) => (
          <OptionButton
            key={opt.value}
            multi
            round
            label={opt.label}
            selected={answers.venues.includes(opt.value)}
            onClick={() => toggleVenue(opt.value)}
          />
        ))}
      </div>
      {answers.venues.includes('custom') && (
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
