import BrandMark from '@/components/BrandMark';

export default function AuthLayout({ onExit, children }) {
  return (
    <div className="onboard-shell">
      <div className="onboard-topbar">
        <button type="button" className="onboard-brand" onClick={onExit}>
          <BrandMark size={26} />PAIR
        </button>
        <button type="button" className="onboard-exit" onClick={onExit}>나중에 하기</button>
      </div>
      <div className="onboard-preview-body">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
