import { useState } from 'react';

const STEPS = [
  {
    title: 'Let\'s start! 시작해 볼까요',
    body: '분석할 논문 PDF를 끌어다 놓거나 \'파일 선택\'으로 골라 주세요. 20MB까지 괜찮아요.',
  },
  {
    title: '한 가지만 더',
    body: 'PDF에서 제목과 초록을 읽어 드려요 — 맞는지 확인하고 \'분석 시작\'을 누르면 비슷한 논문들이 받은 리뷰를 모아 보여드려요.',
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
