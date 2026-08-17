import { Link } from 'react-router-dom';
import BrandMark from '@/components/BrandMark';
import { useAuth } from '@/features/auth/authContext';

// 랜딩은 로그인 여부와 상관없이 같은 페이지다 — Notion처럼 로그인해도 이
// 페이지를 그대로 두고 우측 상단 버튼만 바꾼다(전용 대시보드로 안 옮긴다).
export default function Header() {
  const { status, signOut } = useAuth();
  const authed = status === 'authed';
  // 새로고침 직후 세션 확인이 끝나기 전(loading)엔 로그인 여부를 아직 모른다 —
  // 이때 guest로 단정하면 로그인한 사람한테 "Log in"이 잠깐 잘못 뜬다. 자리를
  // 비워두고 상태가 확정되면 그제서야 맞는 쪽을 보여준다.
  const loading = status === 'loading';

  return (
    <header>
      <nav>
        <Link to="/" className="brand"><BrandMark />PAIR</Link>
        {/* 페이지 아래 섹션들로 순서대로 스크롤한다. 라벨은 각 섹션 내용에 맞춘다. */}
        <div className="navlinks">
          <a href="#problem">Why PAIR</a>
          <a href="#simulator">Live demo</a>
          <a href="#process">How it works</a>
          <a href="#features">Our approach</a>
          <a href="#pricing">Get started</a>
        </div>
        <div className="navright">
          {loading ? null : authed ? (
            <>
              {/* 로그아웃은 이동이 아니라 즉시 실행되는 동작이라 버튼이다 — 링크가 아니다. */}
              <button type="button" className="txt-link" onClick={() => signOut()}>Log out</button>
              <Link to="/app" className="pill">Analyze your paper <span>→</span></Link>
            </>
          ) : (
            <>
              {/* 버튼이 아니라 링크다 — 가운데 클릭·새 탭·주소 복사가 되어야 한다. */}
              <Link to="/login" className="txt-link">Log in</Link>
              <Link to="/onboarding" className="pill">Get started free <span>→</span></Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
