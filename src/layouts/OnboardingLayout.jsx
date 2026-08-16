import BrandMark from '@/components/BrandMark';

const STEP_LABELS = ['사용자 유형', '이용 목적', '분석 기준'];

export default function OnboardingLayout({
  step,
  onExit,
  onBack,
  onNext,
  onSkip,
  canProceed,
  nextLabel = '다음',
  saving = false,
  art,
  children,
}) {
  const totalSteps = STEP_LABELS.length;

  return (
    <div className="onboard-shell">
      <div className="onboard-topbar">
        <button type="button" className="onboard-brand" onClick={onExit}>
          <BrandMark size={26} />PAIR
        </button>
        <button type="button" className="onboard-exit" onClick={onExit}>나중에 하기</button>
      </div>

      <div className="onboard-main">
        <div className="onboard-panel-form">
          <div className="onboard-progress">
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                className={`onboard-dot${i + 1 < step ? ' done' : ''}${i + 1 === step ? ' active' : ''}`}
              />
            ))}
          </div>
          <div className="onboard-step-label">STEP {step} / {totalSteps} · {STEP_LABELS[step - 1]}</div>

          <div className="onboard-q">{children}</div>

          <div className="onboard-nav">
            <button type="button" className="onboard-back" onClick={onBack} disabled={step === 1}>
              ← 이전
            </button>
            <div className="onboard-nav-right">
              <button type="button" className="onboard-skip" onClick={onSkip} disabled={saving}>
                건너뛰기
              </button>
              <button
                type="button"
                className="pill btn-lg"
                onClick={onNext}
                disabled={!canProceed || saving}
              >
                {saving ? '저장 중…' : nextLabel}
              </button>
            </div>
          </div>
        </div>

        <div className="onboard-panel-art">
          {art}
        </div>
      </div>
    </div>
  );
}
