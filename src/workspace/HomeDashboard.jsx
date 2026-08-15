// 로그인 회원의 홈 — ChatGPT식 레이아웃.
//   · 왼쪽 사이드바: 분석 이력 리스트(검색·전체보기), 접기, 하단에 마이페이지
//   · 가운데: 새로운 논문 분석하기(UploadPage를 그대로 얹어 바로 PDF 업로드)
// 업로드→분석 상태는 AppRoutes의 AnalysisProvider가 들고 있어, 분석이 끝나면
// analyze()가 /app/report로 옮겨 같은 결과를 그대로 보여준다.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import { useAuth } from '../auth/authContext';
import { listSubmissions } from '../api/submissions';
import UploadPage from './UploadPage';

export default function HomeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState({ status: 'loading', items: [] });

  useEffect(() => {
    let alive = true;
    listSubmissions()
      .then((data) => { if (alive) setHistory({ status: 'ready', items: Array.isArray(data) ? data : [] }); })
      .catch(() => { if (alive) setHistory({ status: 'error', items: [] }); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history.items;
    return history.items.filter((s) => (s.title || '').toLowerCase().includes(q));
  }, [history.items, query]);

  return (
    <div className={`home-chat${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="home-side">
        <div className="home-side-top">
          <Link to="/" className="onboard-brand home-side-brand"><BrandMark size={24} />PAIR</Link>
          <button
            type="button" className="home-side-toggle"
            onClick={() => setCollapsed(true)} title="사이드바 닫기" aria-label="사이드바 닫기"
          >
            «
          </button>
        </div>

        <div className="home-side-search">
          <input
            type="search"
            className="home-side-search-input"
            placeholder="분석 이력 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="home-side-history">
          <div className="home-side-section">
            <span>분석 이력</span>
            <Link to="/app/papers" className="txt-link home-side-all">전체 보기</Link>
          </div>
          {history.status === 'loading' && <p className="home-side-empty">불러오는 중…</p>}
          {history.status === 'error' && <p className="home-side-empty">불러오지 못했어요.</p>}
          {history.status === 'ready' && (
            filtered.length > 0 ? (
              <ul className="home-side-list">
                {filtered.map((s) => (
                  <li key={s.submission_id}>
                    <button
                      type="button"
                      className="home-side-item"
                      onClick={() => navigate(`/app/papers/${s.submission_id}`)}
                      title={s.title || '제목 없음'}
                    >
                      {s.title || '제목 없음'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="home-side-empty">{query ? '검색 결과가 없어요.' : '아직 분석한 논문이 없어요.'}</p>
            )
          )}
        </div>

        <div className="home-side-foot">
          <button type="button" className="home-side-mypage" onClick={() => navigate('/app/mypage')}>
            마이페이지
          </button>
          <div className="home-side-user">
            <span className="workspace-user">{user?.nickname || '사용자'} 님</span>
            <button type="button" className="txt-link" onClick={() => signOut()}>로그아웃</button>
          </div>
        </div>
      </aside>

      {collapsed && (
        <button
          type="button" className="home-side-open"
          onClick={() => setCollapsed(false)} title="사이드바 열기" aria-label="사이드바 열기"
        >
          »
        </button>
      )}

      <main className="home-main">
        <div className="home-main-inner">
          <h1 className="home-main-title">새로운 논문 분석하기</h1>
          <UploadPage />
        </div>
      </main>
    </div>
  );
}
