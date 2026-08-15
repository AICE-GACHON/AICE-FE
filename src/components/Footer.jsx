import { Link } from 'react-router-dom';

import BrandMark from './BrandMark';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="brand"><BrandMark size={26} />PAIR</div>
        <div className="fine2">PAPER → REVIEW → REVISION</div>
        {/* 약관과 처리방침은 가입 화면 밖에서도 닿을 수 있어야 한다 — 이미 가입한
            사람이 "내가 뭘 동의했더라"를 확인할 곳이 푸터 말고는 없다. */}
        <div className="footer-legal">
          <Link to="/terms">이용약관</Link>
          <span aria-hidden="true">·</span>
          <Link to="/privacy">개인정보처리방침</Link>
        </div>
      </div>
    </footer>
  );
}
