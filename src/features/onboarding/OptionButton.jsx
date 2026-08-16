export default function OptionButton({ selected, onClick, label, desc, multi = false, round = false, disabled = false }) {
  return (
    <button
      type="button"
      className={`onboard-option${selected ? ' selected' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      {/* round: 여러 개 고르는 질문(multi)인데도 다른 단계들과 표시를 원 모양으로
          맞추고 싶을 때 쓴다 — 선택 동작(토글, 최대 개수)은 그대로 다중이다. */}
      <span className={`onboard-indicator ${multi && !round ? 'checkbox' : 'radio'}${selected ? ' on' : ''}`} />
      <span className="onboard-option-text">
        <span className="onboard-option-label">{label}</span>
        {desc && <span className="onboard-option-desc">{desc}</span>}
      </span>
    </button>
  );
}
