import { useState } from 'react';

const STEPS = [
  {
    title: 'Let\'s start! 시작해 볼까요',
    body: '제목과 초록을 입력하면 유사 논문 · 반복되는 리뷰 지적 · 게재 경향을 분석해 드려요.',
  },
  {
    title: '한 가지만 더',
    body: 'PDF 업로드는 곧 지원할 예정이에요. 지금은 제목과 초록을 직접 입력해 주세요.',
  },
];

export default function TourOverlay({ onDone }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const { title, body } = STEPS[step];

  return (
    <div className="tour-card">
      <div className="tour-progress">
        <div className="tour-progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <div className="tour-title">{title}</div>
      <p className="tour-body">{body}</p>
      <div className="tour-actions">
        <button type="button" className="tour-skip" onClick={onDone}>Skip</button>
        <button
          type="button"
          className="tour-next"
          onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
        >
          {isLast ? 'Got it' : 'Next'}
        </button>
      </div>
    </div>
  );
}
