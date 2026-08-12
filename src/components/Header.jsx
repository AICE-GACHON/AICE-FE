import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';

export default function Header() {
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
        {/* 버튼이 아니라 링크다 — 가운데 클릭·새 탭·주소 복사가 되어야 한다. */}
        <div className="navright">
          <Link to="/login" className="txt-link">Log in</Link>
          <Link to="/onboarding" className="pill">Get started free <span>→</span></Link>
        </div>
      </nav>
    </header>
  );
}
