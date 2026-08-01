import {
  buildResultOrder,
  purposeLabel,
  fieldLabel,
  stageLabel,
  venueLabel,
  EXPERIENCE_TONE,
} from '../onboardingData';

export default function StepPreview({ answers, onExit, onCreateAccount, onLogin }) {
  const resultOrder = buildResultOrder(answers.purposes);

  const purposeText = answers.purposes.length
    ? answers.purposes.map(purposeLabel).join(' · ')
    : '기본 설정';

  const fieldText = answers.fields.length
    ? answers.fields
        .map((f) => (f === 'custom' && answers.fieldCustom ? answers.fieldCustom : fieldLabel(f)))
        .filter(Boolean)
        .join(' · ')
    : '설정 안 함';

  const stageText = answers.stage ? stageLabel(answers.stage) : '설정 안 함';

  const venueText = answers.venue
    ? answers.venue === 'custom' && answers.venueCustom
      ? answers.venueCustom
      : venueLabel(answers.venue)
    : '설정 안 함';

  const tone = EXPERIENCE_TONE[answers.experience];

  return (
    <div className="onboard-preview-shell">
      <div className="onboard-topbar">
        <button type="button" className="onboard-brand" onClick={onExit}>
          <span className="mark" style={{ width: 26, height: 26, fontSize: 13 }}>P</span>PaperTrace
        </button>
        <button type="button" className="onboard-exit" onClick={onExit}>나중에 하기</button>
      </div>

      <div className="onboard-preview-body">
        <div className="onboard-preview-card">
          <div className="eyebrow">준비 완료</div>
          <h2>회원님을 위한 분석 환경을 준비했어요</h2>

          <div className="onboard-summary-grid">
            <div>
              <span className="onboard-summary-key">사용 목적</span>
              <span className="onboard-summary-val">{purposeText}</span>
            </div>
            <div>
              <span className="onboard-summary-key">연구 분야</span>
              <span className="onboard-summary-val">{fieldText}</span>
            </div>
            <div>
              <span className="onboard-summary-key">현재 단계</span>
              <span className="onboard-summary-val">{stageText}</span>
            </div>
            <div>
              <span className="onboard-summary-key">분석 기준</span>
              <span className="onboard-summary-val">{venueText} 데이터를 우선 참고</span>
            </div>
          </div>

          {tone && <p className="onboard-tone-note">{tone}</p>}

          <h3 className="onboard-subq" style={{ marginTop: 28 }}>제공 예정 기능</h3>
          <ol className="onboard-result-order">
            {resultOrder.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>

          <div className="onboard-preview-actions">
            <button type="button" className="pill btn-lg" onClick={onCreateAccount}>
              계정 만들고 분석 시작하기 <span>→</span>
            </button>
            <button type="button" className="onboard-login-link" onClick={onLogin}>
              이미 계정이 있어요
            </button>
          </div>
          <p className="fine" style={{ textAlign: 'center' }}>
            질문을 건너뛴 항목은 기본 설정으로 분석합니다. 회원가입 후 마이페이지에서 언제든 바꿀 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
