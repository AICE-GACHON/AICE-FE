import { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import StepArt from './StepArt';
import StepUserType from './steps/StepUserType';
import StepPurpose from './steps/StepPurpose';
import StepCriteria from './steps/StepCriteria';
import StepPreview from './steps/StepPreview';
import { loadAnswers, saveAnswers } from './sessionState';
import { saveOnboardingProfile } from '../api/onboarding';
import { buildResultOrder } from './onboardingData';

// AICE-BE의 OnboardingCreate 스키마(app/schemas/onboarding.py)는 snake_case를 그대로 받는다.
function buildOnboardingPayload(answers) {
  return {
    user_type: answers.userType,
    experience: answers.experience,
    purposes: answers.purposes,
    fields: answers.fields.map((f) => (f === 'custom' ? answers.fieldCustom : f)).filter(Boolean),
    stage: answers.stage,
    venue: answers.venue === 'custom' ? answers.venueCustom : answers.venue,
    result_order: buildResultOrder(answers.purposes),
  };
}

export default function OnboardingFlow({ onExit, onGoToSignup, onGoToLogin }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState(loadAnswers);
  const [saving, setSaving] = useState(false);

  const update = (patch) => {
    setAnswers((prev) => {
      const next = { ...prev, ...patch };
      saveAnswers(next);
      return next;
    });
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const advance = async () => {
    if (step === 3) {
      setSaving(true);
      try {
        const result = await saveOnboardingProfile(buildOnboardingPayload(answers));
        if (result?.onboarding_id) update({ onboardingId: result.onboarding_id });
      } catch (err) {
        // rate limit(429) 등으로 저장이 안 되도 온보딩 연결 없이 회원가입은 계속 진행한다
        console.error('온보딩 저장 실패, 연결 없이 계속 진행:', err);
      } finally {
        setSaving(false);
      }
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const canProceed =
    step === 1 ? Boolean(answers.userType) :
    step === 2 ? answers.purposes.length > 0 :
    step === 3 ? Boolean(answers.stage) :
    true;

  if (step === 4) {
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
      canProceed={canProceed}
      nextLabel={step === 3 ? '맞춤 분석 시작하기' : '다음'}
      saving={saving}
      art={<StepArt step={step} />}
    >
      <StepComponent answers={answers} update={update} />
    </OnboardingLayout>
  );
}
