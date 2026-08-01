export default function Field({ label, error, ...inputProps }) {
  return (
    <label className="auth-field">
      <span className="auth-field-label">{label}</span>
      <input className={`auth-input${error ? ' has-error' : ''}`} {...inputProps} />
      {error && <span className="auth-field-error">{error}</span>}
    </label>
  );
}
