// 로그인한(=이미 회원가입한) 사용자의 홈. 로그인 전·게스트가 보는 마케팅
// 랜딩(LandingPage)과는 다른, "이미 서비스를 쓰는 사람의 대시보드"다.
// routes.jsx의 HomeRoute가 로그인 여부로 이 화면과 랜딩을 가른다.
//
// 세 칸으로 나뉜다:
//   · 새로운 논문 분석하기 → PDF 업로드 폼(/app/upload)
//   · 분석 이력 → 실제 내 제출 목록(미리보기) + 전체는 /app/papers
//   · 마이페이지 → 계정 요약 + 전체 설정은 /app/mypage
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import Footer from '../components/Footer';
import { useAuth } from '../auth/authContext';
import { listSubmissions } from '../api/submissions';

const HISTORY_PREVIEW = 4;

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function HomeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState({ status: 'loading', items: [] });

  useEffect(() => {
    let alive = true;
    listSubmissions()
      .then((data) => { if (alive) setHistory({ status: 'ready', items: Array.isArray(data) ? data : [] }); })
      .catch(() => { if (alive) setHistory({ status: 'error', items: [] }); });
    return () => { alive = false; };
  }, []);

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
          <div className="home-panel-title">새로운 논문 분석하기</div>
          <p className="home-panel-desc">PDF를 올리면 비슷한 논문과 그 리뷰·결과를 분석해 드려요.</p>
          <span className="home-panel-cta">업로드하러 가기 <span aria-hidden="true">→</span></span>
        </button>

        {/* 분석 이력 — 실제 제출 목록 미리보기 */}
        <section className="home-panel home-panel-history">
          <div className="home-panel-head">
            <div className="home-panel-title">분석 이력</div>
            <Link to="/app/papers" className="txt-link home-panel-more">전체 보기 →</Link>
          </div>
          {history.status === 'loading' && <p className="home-panel-empty">불러오는 중…</p>}
          {history.status === 'error' && <p className="home-panel-empty">이력을 불러오지 못했어요.</p>}
          {history.status === 'ready' && (
            history.items.length > 0 ? (
              <ul className="home-history-list">
                {history.items.slice(0, HISTORY_PREVIEW).map((s) => (
                  <li key={s.submission_id}>
                    <button
                      type="button"
                      className="home-history-item"
                      onClick={() => navigate(`/app/papers/${s.submission_id}`)}
                    >
                      <span className="home-history-title">{s.title || '제목 없음'}</span>
                      <span className="wr-muted">{formatDate(s.created_at)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="home-panel-empty">아직 분석한 논문이 없어요. 논문을 올려 보면 여기 쌓여요.</p>
            )
          )}
        </section>

        {/* 마이페이지 — 계정 요약 */}
        <section className="home-panel home-panel-mypage">
          <div className="home-panel-head">
            <div className="home-panel-title">마이페이지</div>
            <Link to="/app/mypage" className="txt-link home-panel-more">설정 열기 →</Link>
          </div>
          <div className="home-mypage-summary">
            <div className="home-mypage-row"><span className="wr-muted">닉네임</span><b>{user?.nickname || '—'}</b></div>
            <div className="home-mypage-row"><span className="wr-muted">이메일</span><span>{user?.email || '—'}</span></div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
