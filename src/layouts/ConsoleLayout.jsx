// 딥그린 레일 + 작업 영역, 두 칸짜리 콘솔 껍데기.
//
// 원래 이 레일은 홈(HomeDashboard) 안에만 있었다. 그런데 레일이 하는 일은
// "다른 분석으로 갈아타기"이고, 그게 가장 필요한 자리는 결과를 다 읽고 난
// 뒤다 — 홈에만 있으면 결과 화면에서 이력을 보려고 한 번 홈으로 나갔다가
// 다시 들어와야 했다. 그래서 껍데기로 올려 /app 화면들이 같이 쓴다.
//
// 접힘 상태는 이 컴포넌트가 들고 있다 — 홈(/)과 /app은 서로 다른 라우트라 옮겨
// 다니면 다시 마운트되는데, 접어둔 건 그 화면에서의 선택이라 초기화되는 편이 맞다.
// 이력 목록 자체는 SubmissionsProvider가 라우터 전체 위에서 들고 있다 — 분석
// 이력 페이지(PapersPage)에서 지운 게 여기 사이드바에도 곧바로 반영되려면 두
// 화면이 같은 배열을 봐야 하기 때문이다.
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandMark from '@/components/BrandMark';
import { useAuth } from '@/features/auth/authContext';
import { useSubmissionsHistory } from '@/features/workspace/submissionsContext';

/** "2026-08-16" — 레일은 좁아서 시각까지 넣으면 제목이 밀린다. */
function shortDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
}

// 로그아웃은 signOut만 부른다. 보호 구역(/app) 안에서 눌러도 로그인 폼으로
// 튕기지 않는다 — 어디로 보낼지는 RequireAuth가 signedOut을 보고 정한다
// (guards.jsx). 여기서 navigate를 곁들이면 그 판단과 순서 경쟁만 붙는다.
export default function ConsoleLayout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const { items, status } = useSubmissionsHistory();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => (s.title || '').toLowerCase().includes(q));
  }, [items, query]);

  const nickname = user?.nickname || '사용자';

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
          <svg className="home-side-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            className="home-side-search-input"
            placeholder="SEARCH HISTORY"
            aria-label="분석 이력 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="home-side-history">
          <div className="home-side-section">
            {/* 개수를 라벨에 붙인다 — 목록을 세지 않고도 이력이 몇 건인지 안다. */}
            <span>분석 이력 · {items.length}</span>
            <Link to="/app/papers" className="txt-link home-side-all">전체</Link>
          </div>
          {status === 'loading' && <p className="home-side-empty">불러오는 중…</p>}
          {status === 'error' && <p className="home-side-empty">불러오지 못했어요.</p>}
          {status === 'ready' && (
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
                      <span className="home-side-item-title">{s.title || '제목 없음'}</span>
                      <span className="home-side-item-meta">
                        {shortDate(s.created_at)}{s.field ? ` · ${s.field}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="home-side-empty">{query ? '검색 결과가 없어요.' : '아직 분석한 논문이 없어요.'}</p>
            )
          )}
        </div>

        {/* 하단 — 사용자 이름을 누르면 마이페이지로 (별도 버튼 없이) */}
        <div className="home-side-foot">
          <button
            type="button" className="home-side-user-btn"
            onClick={() => navigate('/app/mypage')} title="마이페이지"
          >
            <span className="home-side-avatar">{nickname.charAt(0)}</span>
            <span className="home-side-user-name">{nickname} 님</span>
          </button>
          <button type="button" className="txt-link home-side-logout" onClick={() => signOut()}>로그아웃</button>
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

      <main className="home-main">{children}</main>
    </div>
  );
}
