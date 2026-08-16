import BrandMark from '@/components/BrandMark';
import {
  userTypeLabel,
  fieldLabel,
  similarityFocusLabel,
  recencyBiasLabel,
  venueLabel,
} from '../onboardingData';

export default function StepPreview({ answers, onExit, onCreateAccount, onLogin }) {
  const roleText = answers.userType ? userTypeLabel(answers.userType) : '설정 안 함';

  const fieldNames = answers.fields
    .map((f) => (f === 'custom' ? answers.fieldCustom : fieldLabel(f)))
    .filter(Boolean);

  const focusText = answers.similarityFocus ? similarityFocusLabel(answers.similarityFocus) : '균형있게';
  const recencyText = answers.recencyBias ? recencyBiasLabel(answers.recencyBias) : '균형있게';

  const venueText = answers.venues.length
    ? answers.venues.map((v) => (v === 'custom' ? answers.venueCustom : venueLabel(v))).filter(Boolean).join(' · ')
    : '설정 안 함';

  return (
    <div className="onboard-preview-shell">
      <div className="onboard-topbar">
        <button type="button" className="onboard-brand" onClick={onExit}>
          <BrandMark size={26} />PAIR
        </button>
        <button type="button" className="onboard-exit" onClick={onExit}>나중에 하기</button>
      </div>

      <div className="onboard-preview-body">
        <div className="onboard-preview-card">
          <div className="eyebrow">준비 완료</div>
          <h2>회원님을 위한 분석 환경을 준비했어요</h2>

          <div className="onboard-summary-grid">
            <div>
              <span className="onboard-summary-key">역할</span>
              <span className="onboard-summary-val">{roleText}</span>
            </div>
            <div>
              <span className="onboard-summary-key">전공 분야</span>
              {fieldNames.length ? (
                fieldNames.map((name) => (
                  <span key={name} className="onboard-summary-val" style={{ display: 'block' }}>{name}</span>
                ))
              ) : (
                <span className="onboard-summary-val">설정 안 함</span>
              )}
            </div>
            <div>
              <span className="onboard-summary-key">검색 우선순위</span>
              <span className="onboard-summary-val" style={{ display: 'block' }}>관점: {focusText}</span>
              <span className="onboard-summary-val" style={{ display: 'block' }}>경향: {recencyText}</span>
            </div>
            <div>
              <span className="onboard-summary-key">목표 학회</span>
              <span className="onboard-summary-val">{venueText}</span>
            </div>
          </div>

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
