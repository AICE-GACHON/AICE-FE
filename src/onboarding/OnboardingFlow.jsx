import { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import StepArt from './StepArt';
import StepUserType from './steps/StepUserType';
import StepPurpose from './steps/StepPurpose';
import StepCriteria from './steps/StepCriteria';
import StepPreview from './steps/StepPreview';
import { loadAnswers, saveAnswers } from './sessionState';
import { saveOnboardingProfile } from '../api/onboarding';
// 되읽기(answersFromProfile)와 짝이라 profileMapping.js에 함께 둔다 — 한쪽만
// 고치면 값이 조용히 다른 값으로 되살아난다.
import { toOnboardingPayload } from './profileMapping';
import { TOTAL_STEPS, canProceed } from './steps';

/**
 * 현재 단계는 주소가 들고 있다(/onboarding/:step) — 3단계에서 뒤로가기를 눌렀을 때
 * 앱을 벗어나는 대신 2단계로 가야 하기 때문이다. 이 컴포넌트는 라우터를 모른다.
 * step을 받고 onStepChange로 알릴 뿐, 그 값이 어디서 오는지는 호출부가 정한다.
 *
 * 답변은 여전히 여기가 들고 있다. 단계가 바뀌어도 이 컴포넌트는 언마운트되지
 * 않으므로(같은 라우트의 파라미터만 바뀐다) 상태가 유지된다.
 */
export default function OnboardingFlow({ step, onStepChange, onExit, onGoToSignup, onGoToLogin }) {
  const [answers, setAnswers] = useState(loadAnswers);
  const [saving, setSaving] = useState(false);

  const update = (patch) => {
    setAnswers((prev) => {
      const next = { ...prev, ...patch };
      saveAnswers(next);
      return next;
    });
  };

  const goBack = () => onStepChange(Math.max(1, step - 1));

  const advance = async () => {
    if (step === 3) {
      setSaving(true);
      try {
        const result = await saveOnboardingProfile(toOnboardingPayload(answers));
        if (result?.onboarding_id) update({ onboardingId: result.onboarding_id });
      } catch (err) {
        // rate limit(429) 등으로 저장이 안 되도 온보딩 연결 없이 회원가입은 계속 진행한다
        console.error('온보딩 저장 실패, 연결 없이 계속 진행:', err);
      } finally {
        setSaving(false);
      }
    }
    // 저장은 이 버튼에서만 한다. 뒤로 갔다가 브라우저 '앞으로'로 4단계에 다시
    // 닿는 경로에서는 돌지 않는데, 그게 맞다 — 누를 때마다 POST하면 온보딩
    // 답변 행이 계속 새로 쌓인다.
    onStepChange(Math.min(TOTAL_STEPS, step + 1));
  };

  if (step === TOTAL_STEPS) {
    return (
      <StepPreview
        answers={answers}
        onExit={onExit}
        onCreateAccount={onGoToSignup}
        onLogin={onGoToLogin}
      />
    );
  }

  const StepComponent = step === 1 ? StepUserType : step === 2 ? StepPurpose : StepCriteria;

  return (
    <OnboardingLayout
      step={step}
      onExit={onExit}
      onBack={goBack}
      onNext={advance}
      onSkip={advance}
      canProceed={canProceed(step, answers)}
      nextLabel={step === 3 ? '맞춤 분석 시작하기' : '다음'}
      saving={saving}
      art={<StepArt step={step} />}
    >
      <StepComponent answers={answers} update={update} />
    </OnboardingLayout>
  );
}
