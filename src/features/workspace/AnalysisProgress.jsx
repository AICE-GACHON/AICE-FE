// 분석이 도는 동안 보여주는 화면 — 서버가 알려준 단계를 그대로 쌓아 보여준다.
//
// 예전에는 "분석 중…" 한 줄이었다. 서버가 pending/running 말고는 아무것도 몰랐기
// 때문이고, 화면이 게을러서가 아니었다. 이제 분석 파이프라인이 단계마다 이벤트를
// 내보내므로(paper_assistant.analyze의 on_event) 그것을 그린다.
//
// ⚠️ **진행률 막대를 만들지 마세요.** 단계별 소요 시간이 극단적으로 다르다 —
// 첫 분석의 모델 로드가 수십 초, LLM 재정렬이 수십 초, 나머지는 수 초다. 어떤
// 비율을 그려도 사실이 아니고, 80%에서 한참 멈춰 있는 막대는 아무 말도 없는 것보다
// 나쁘다. 유사도 점수를 만들지 않는 것과 같은 이유다.
import { useEffect, useState } from 'react';
import { currentStep, toSteps } from './progressSteps';

/** 초 → "1분 20초". 분석은 길어야 몇 분이라 시간 단위는 없다. */
function formatElapsed(seconds) {
  if (seconds < 60) return `${seconds}초`;
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}

function Elapsed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  // 처음 몇 초는 숨긴다 — "0초"부터 세는 것은 정보가 아니라 초조함만 준다.
  if (seconds < 5) return null;
  return <div className="analysis-elapsed">{formatElapsed(seconds)}째 분석 중</div>;
}

/**
 * @param {{progress: Array, statusText: string}} props
 */
export default function AnalysisProgress({ progress, statusText }) {
  const steps = toSteps(progress);
  const running = currentStep(steps);

  // 제목은 **지금 참인 문장**만 쓴다. 돌고 있는 단계가 있으면 그것을, 단계 사이의
  // 짧은 틈에 폴링이 걸렸으면 마지막으로 끝난 일을 말한다. 여기에 "거의 다 됐어요"
  // 같은 말을 넣고 싶어지지만, 남은 시간을 우리는 모른다 — 재정렬이 아직이면 1분이
  // 더 남았을 수도 있다. 진행률 막대를 안 그리는 것과 같은 이유다.
  const latest = running ?? steps[steps.length - 1];
  const heading = latest ? latest.label : `${statusText}…`;

  return (
    <div className="wr-card upload-card">
      <div className="wr-card-title">{heading}</div>
      <p className="onboard-desc">
        비슷한 논문을 찾고, 그중 정말 비슷한 것을 골라 리뷰를 모으고 있어요.
      </p>

      {steps.length > 0 && (
        // aria-live로 읽어 준다 — 화면을 못 보는 사용자에게는 이 목록이 유일한
        // 진행 정보다. polite라 읽던 것을 끊지 않는다.
        <ol className="analysis-steps" aria-live="polite">
          {steps.map((step) => (
            <li
              key={step.step}
              className={'analysis-step' + (step.done ? ' is-done' : ' is-current')}
            >
              <span className="analysis-step-mark" aria-hidden="true">
                {step.done ? <CheckIcon /> : <span className="analysis-step-spinner" />}
              </span>
              <span className="analysis-step-body">
                <span className="analysis-step-label">{step.label}</span>
                {step.detail && (
                  <span className="analysis-step-detail">{step.detail}</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}

      <Elapsed />
      <p className="fine">첫 분석은 모델 로드 때문에 1~2분 정도 걸릴 수 있어요.</p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 12.5 5.5 5.5L20 6.5" />
    </svg>
  );
}
