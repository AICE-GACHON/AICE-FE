import BrandMark from './BrandMark';

export default function Header({ onGetStarted, onLogin }) {
  return (
    <header>
      <nav>
        <div className="brand"><BrandMark />PAIR</div>
        <div className="navlinks">
          <a href="#features">Product <span className="chev">▾</span></a>
          <a href="#process">Use Cases <span className="chev">▾</span></a>
          <a href="#scope">Conferences <span className="chev">▾</span></a>
          <a href="#pricing">Pricing</a>
          <a href="#simulator">Resources <span className="chev">▾</span></a>
        </div>
        <div className="navright">
          <button type="button" className="txt-link" onClick={onLogin}>Log in</button>
          <button type="button" className="pill" onClick={onGetStarted}>Get started free <span>→</span></button>
        </div>
      </nav>
    </header>
  );
}