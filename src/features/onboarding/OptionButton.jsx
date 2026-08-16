export default function OptionButton({ selected, onClick, label, desc, multi = false, disabled = false }) {
  return (
    <button
      type="button"
      className={`onboard-option${selected ? ' selected' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      <span className={`onboard-indicator ${multi ? 'checkbox' : 'radio'}${selected ? ' on' : ''}`} />
      <span className="onboard-option-text">
        <span className="onboard-option-label">{label}</span>
        {desc && <span className="onboard-option-desc">{desc}</span>}
      </span>
    </button>
  );
}
