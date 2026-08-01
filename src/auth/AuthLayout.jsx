export default function AuthLayout({ onExit, children }) {
  return (
    <div className="onboard-shell">
      <div className="onboard-topbar">
        <button type="button" className="onboard-brand" onClick={onExit}>
          <span className="mark" style={{ width: 26, height: 26, fontSize: 13 }}>P</span>PaperTrace
        </button>
        <button type="button" className="onboard-exit" onClick={onExit}>나중에 하기</button>
      </div>
      <div className="onboard-preview-body">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
