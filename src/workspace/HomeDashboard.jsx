// 로그인한(=이미 회원가입한) 사용자의 홈. 로그인 전·게스트가 보는 마케팅
// 랜딩(LandingPage)과는 다른, "이미 서비스를 쓰는 사람의 대시보드"다.
// 첫 로그인은 랜딩을 한 번 보여주고, 그다음부터 이 화면을 준다(routes.jsx HomeRoute).
//
// 세 칸:
//   · 새로운 논문 분석하기 → PDF 업로드 폼(/app/upload)으로 이동
//   · 분석 이력 → PapersPage를 통째로 임베드(embedded 모드)
//   · 마이페이지 → MyPage를 통째로 임베드(embedded 모드)
// 임베드된 화면은 각자 자기 데이터를 불러오고 저장/삭제까지 그대로 동작한다.
import { Link, useNavigate } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import Footer from '../components/Footer';
import { useAuth } from '../auth/authContext';
import PapersPage from './PapersPage';
import MyPage from './MyPage';
import { clearTokens } from '../api/tokenStorage';
import { clearAnswers } from '../onboarding/sessionState';

export default function HomeDashboard() {
  const { user, setUser, signOut } = useAuth();
  const navigate = useNavigate();

  // 탈퇴 직후 처리는 MyPageRoute(routes.jsx)와 같은 이유로 하드 이동한다 —
  // 계정이 사라졌으면 메모리에 남은 것도 같이 버리는 게 맞다.
  const handleAccountDeleted = () => {
    clearTokens();
    clearAnswers();
    window.location.replace('/');
  };

  return (
    <div className="home-dash">
      <header className="home-dash-bar">
        <Link to="/" className="onboard-brand"><BrandMark size={26} />PAIR</Link>
        <div className="home-dash-bar-right">
          {user?.nickname && <span className="workspace-user">{user.nickname} 님</span>}
          <button type="button" className="txt-link" onClick={() => signOut()}>로그아웃</button>
        </div>
      </header>

      <main className="home-dash-grid wrap">
        {/* 새로운 논문 분석하기 → 업로드 폼 */}
        <button type="button" className="home-panel home-panel-new" onClick={() => navigate('/app/upload')}>
          <div>
            <div className="home-panel-title">새로운 논문 분석하기</div>
            <p className="home-panel-desc">PDF를 올리면 비슷한 논문과 그 리뷰·결과를 분석해 드려요.</p>
          </div>
          <span className="home-panel-cta">업로드하러 가기 <span aria-hidden="true">→</span></span>
        </button>

        {/* 분석 이력 — PapersPage 통째 임베드 */}
        <section className="home-panel home-panel-embed home-panel-history">
          <div className="home-panel-head">
            <div className="home-panel-title">분석 이력</div>
            <Link to="/app/papers" className="txt-link home-panel-more">전체 화면 →</Link>
          </div>
          <div className="home-embed-scroll">
            <PapersPage embedded />
          </div>
        </section>

        {/* 마이페이지 — MyPage 통째 임베드 */}
        <section className="home-panel home-panel-embed home-panel-mypage">
          <div className="home-panel-head">
            <div className="home-panel-title">마이페이지</div>
            <Link to="/app/mypage" className="txt-link home-panel-more">전체 화면 →</Link>
          </div>
          <div className="home-embed-scroll">
            <MyPage
              embedded
              user={user}
              onUserChange={setUser}
              onAccountDeleted={handleAccountDeleted}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
