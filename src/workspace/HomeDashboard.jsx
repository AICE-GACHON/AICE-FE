// 로그인 회원의 홈 — ChatGPT식 레이아웃.
//   · 왼쪽 사이드바: 고정됨 / 파일(폴더) / 분석 이력, 검색·전체보기, 접기,
//     하단에 사용자(클릭 시 마이페이지)
//   · 가운데: 새로운 논문 분석하기(UploadPage를 embedded로 얹어 바로 PDF 업로드)
//
// 각 이력 항목의 "…" 메뉴에서 공유·이름 바꾸기·고정·파일 이동·삭제를 할 수 있고,
// 항목을 파일 폴더로 드래그해 보관할 수 있다.
//
// ⚠️ 고정/파일/이동/이름은 지금 **프론트 localStorage에만** 저장된다(organizeStore).
// 백엔드 엔드포인트가 생기면 organizeStore와 아래 mutator 호출부만 API로 교체하면 된다
// (→ docs/BACKEND_요청_사이드바_정리.md).
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import { useAuth } from '../auth/authContext';
import { listSubmissions, deleteSubmission } from '../api/submissions';
import { useOrganize } from './organizeStore';
import ShareDialog from './ShareDialog';
import UploadPage from './UploadPage';

const DRAG_MIME = 'application/x-pair-submission';

// 고정 표시용 압정 아이콘 (이모지 대신 브랜드 색 SVG).
function PinIcon({ size = 13, className }) {
  return (
    <svg
      className={className} width={size} height={size} viewBox="0 0 24 24"
      fill="currentColor" aria-hidden="true"
    >
      <path d="M16 9V4h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1v5c0 1.66-1.34 3-3 3v2h5.97v6l1 1 1-1v-6H19v-2c-1.66 0-3-1.34-3-3z" />
    </svg>
  );
}

export default function HomeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState({ status: 'loading', items: [] });

  const userKey = user?.user_id || user?.email || 'anon';
  const org = useOrganize(userKey);

  // UI 상태: 열린 메뉴 / 공유 대상 / 이름 바꾸는 항목 / 새 폴더 입력 / 드래그 오버 폴더
  const [menuFor, setMenuFor] = useState(null);       // submission_id
  const [shareItem, setShareItem] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [newFolder, setNewFolder] = useState(false);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [openFolders, setOpenFolders] = useState({}); // folderId -> bool(펼침)

  useEffect(() => {
    let alive = true;
    listSubmissions()
      .then((data) => { if (alive) setHistory({ status: 'ready', items: Array.isArray(data) ? data : [] }); })
      .catch(() => { if (alive) setHistory({ status: 'error', items: [] }); });
    return () => { alive = false; };
  }, []);

  const nickname = user?.nickname || '사용자';
  const titleOf = (s) => org.titles[s.submission_id] || s.title || '제목 없음';

  // 검색 필터 (표시 제목 기준)
  const q = query.trim().toLowerCase();
  const match = (s) => !q || titleOf(s).toLowerCase().includes(q);

  // 섹션 분류: 고정됨 → 파일별 → 나머지(분석 이력)
  const { pinned, byFolder, loose } = useMemo(() => {
    const items = history.items.filter(match);
    const pinnedSet = new Set(org.pinned);
    const pinnedItems = items.filter((s) => pinnedSet.has(s.submission_id));
    const rest = items.filter((s) => !pinnedSet.has(s.submission_id));
    const folderMap = {};
    for (const f of org.folders) folderMap[f.id] = [];
    const looseItems = [];
    for (const s of rest) {
      const fid = org.membership[s.submission_id];
      if (fid && folderMap[fid]) folderMap[fid].push(s);
      else looseItems.push(s);
    }
    return { pinned: pinnedItems, byFolder: folderMap, loose: looseItems };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.items, org.pinned, org.folders, org.membership, org.titles, q]);

  async function handleDelete(s) {
    if (!window.confirm(`"${titleOf(s)}"을(를) 삭제할까요? 분석 결과도 함께 지워집니다.`)) return;
    setMenuFor(null);
    try {
      await deleteSubmission(s.submission_id);
      setHistory((h) => ({ ...h, items: h.items.filter((x) => x.submission_id !== s.submission_id) }));
      org.forget(s.submission_id);
    } catch {
      alert('삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  }

  function handleDropOnFolder(e, folderId) {
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData('text/plain');
    if (id) {
      org.moveToFolder(id, folderId);
      setOpenFolders((o) => ({ ...o, [folderId]: true }));
    }
    setDragOverFolder(null);
  }

  const renderRow = (s) => {
    const id = s.submission_id;
    const inFolder = Boolean(org.membership[id]);
    const isPinned = org.pinned.includes(id);
    return (
      <li key={id} className="home-side-row">
        {renamingId === id ? (
          <input
            className="home-side-rename"
            autoFocus
            defaultValue={titleOf(s)}
            onBlur={(e) => { org.setTitle(id, e.target.value); setRenamingId(null); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { org.setTitle(id, e.target.value); setRenamingId(null); }
              if (e.key === 'Escape') setRenamingId(null);
            }}
          />
        ) : (
          <>
            <button
              type="button"
              className="home-side-item"
              draggable
              onDragStart={(e) => { e.dataTransfer.setData(DRAG_MIME, id); e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; }}
              onClick={() => navigate(`/app/papers/${id}`)}
              title={titleOf(s)}
            >
              {isPinned && <PinIcon className="home-side-pin" />}
              {titleOf(s)}
            </button>
            <button
              type="button"
              className="home-side-more"
              aria-label="더보기"
              onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === id ? null : id); }}
            >
              ⋯
            </button>
          </>
        )}

        {menuFor === id && (
          <>
            <div className="home-menu-scrim" onClick={() => setMenuFor(null)} />
            <div className="home-menu" role="menu">
              <button type="button" className="home-menu-item" onClick={() => { setShareItem(s); setMenuFor(null); }}>
                <span className="home-menu-ico">↗</span>공유하기
              </button>
              <button type="button" className="home-menu-item" onClick={() => { setRenamingId(id); setMenuFor(null); }}>
                <span className="home-menu-ico">✎</span>이름 바꾸기
              </button>
              <button type="button" className="home-menu-item" onClick={() => { org.togglePin(id); setMenuFor(null); }}>
                <PinIcon className="home-menu-ico" />{isPinned ? '고정 해제' : '채팅 고정'}
              </button>

              <div className="home-menu-sep" />
              <div className="home-menu-label">파일로 이동</div>
              {org.folders.length === 0 && <div className="home-menu-hint">아직 파일이 없어요</div>}
              {org.folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="home-menu-item is-sub"
                  onClick={() => { org.moveToFolder(id, f.id); setOpenFolders((o) => ({ ...o, [f.id]: true })); setMenuFor(null); }}
                >
                  <span className="home-menu-ico">🗂</span>{f.name}
                </button>
              ))}
              <button
                type="button"
                className="home-menu-item is-sub"
                onClick={() => { const f = org.createFolder('새 파일'); org.moveToFolder(id, f.id); setOpenFolders((o) => ({ ...o, [f.id]: true })); setMenuFor(null); }}
              >
                <span className="home-menu-ico">＋</span>새 파일로 이동
              </button>
              {inFolder && (
                <button type="button" className="home-menu-item is-sub" onClick={() => { org.moveToFolder(id, null); setMenuFor(null); }}>
                  <span className="home-menu-ico">↩</span>파일에서 빼기
                </button>
              )}

              <div className="home-menu-sep" />
              <button type="button" className="home-menu-item is-danger" onClick={() => handleDelete(s)}>
                <span className="home-menu-ico">🗑</span>삭제
              </button>
            </div>
          </>
        )}
      </li>
    );
  };

  const ready = history.status === 'ready';

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
            placeholder="분석 이력 논문 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="home-side-history">
          {history.status === 'loading' && <p className="home-side-empty">불러오는 중…</p>}
          {history.status === 'error' && <p className="home-side-empty">불러오지 못했어요.</p>}

          {/* 고정됨 */}
          {ready && pinned.length > 0 && (
            <>
              <div className="home-side-section"><span>고정됨</span></div>
              <ul className="home-side-list">{pinned.map(renderRow)}</ul>
            </>
          )}

          {/* 파일(폴더) */}
          {ready && (
            <>
              <div className="home-side-section">
                <span>파일</span>
                <button type="button" className="home-side-add" title="새 파일" onClick={() => setNewFolder(true)}>＋</button>
              </div>
              {newFolder && (
                <input
                  className="home-side-rename home-side-newfolder"
                  autoFocus
                  placeholder="파일 이름"
                  onBlur={(e) => { if (e.target.value.trim()) org.createFolder(e.target.value); setNewFolder(false); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { if (e.target.value.trim()) org.createFolder(e.target.value); setNewFolder(false); }
                    if (e.key === 'Escape') setNewFolder(false);
                  }}
                />
              )}
              {org.folders.length === 0 && !newFolder && (
                <p className="home-side-empty">＋로 파일을 만들고 논문을 끌어다 놓아 보관하세요.</p>
              )}
              {org.folders.map((f) => {
                const items = byFolder[f.id] || [];
                const isOpen = openFolders[f.id] ?? true;
                return (
                  <div
                    key={f.id}
                    className={`home-folder${dragOverFolder === f.id ? ' is-drop' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverFolder(f.id); }}
                    onDragLeave={() => setDragOverFolder((cur) => (cur === f.id ? null : cur))}
                    onDrop={(e) => handleDropOnFolder(e, f.id)}
                  >
                    <div className="home-folder-head">
                      <button type="button" className="home-folder-toggle" onClick={() => setOpenFolders((o) => ({ ...o, [f.id]: !isOpen }))}>
                        <span className="home-folder-caret">{isOpen ? '▾' : '▸'}</span>
                        <span className="home-folder-ico" aria-hidden="true">🗂</span>
                        <span className="home-folder-name">{f.name}</span>
                        {items.length > 0 && <span className="home-folder-count">{items.length}</span>}
                      </button>
                      <button
                        type="button" className="home-side-more"
                        aria-label="파일 메뉴"
                        onClick={(e) => { e.stopPropagation(); setMenuFor(`folder:${f.id}`); }}
                      >
                        ⋯
                      </button>
                      {menuFor === `folder:${f.id}` && (
                        <>
                          <div className="home-menu-scrim" onClick={() => setMenuFor(null)} />
                          <div className="home-menu" role="menu">
                            <button type="button" className="home-menu-item"
                              onClick={() => { const name = window.prompt('파일 이름', f.name); if (name) org.renameFolder(f.id, name); setMenuFor(null); }}>
                              <span className="home-menu-ico">✎</span>이름 바꾸기
                            </button>
                            <button type="button" className="home-menu-item is-danger"
                              onClick={() => { if (window.confirm(`"${f.name}" 파일을 삭제할까요? 안의 논문은 분석 이력으로 돌아갑니다.`)) org.deleteFolder(f.id); setMenuFor(null); }}>
                              <span className="home-menu-ico">🗑</span>파일 삭제
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {isOpen && (
                      items.length > 0
                        ? <ul className="home-side-list home-folder-list">{items.map(renderRow)}</ul>
                        : <p className="home-folder-empty">여기로 논문을 끌어다 놓으세요</p>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* 분석 이력 (고정·파일에 속하지 않은 나머지) */}
          {ready && (
            <div
              className="home-side-loose"
              onDragOver={(e) => { e.preventDefault(); setDragOverFolder('__loose__'); }}
              onDragLeave={() => setDragOverFolder((cur) => (cur === '__loose__' ? null : cur))}
              onDrop={(e) => handleDropOnFolder(e, null)}
            >
              <div className="home-side-section">
                <span>분석 이력</span>
                <Link to="/app/papers" className="txt-link home-side-all">전체 보기</Link>
              </div>
              {loose.length > 0 ? (
                <ul className="home-side-list">{loose.map(renderRow)}</ul>
              ) : (
                <p className="home-side-empty">{query ? '검색 결과가 없어요.' : '아직 분석한 논문이 없어요.'}</p>
              )}
            </div>
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

      <main className="home-main">
        <div className="home-main-inner">
          <p className="home-greeting">어떤 논문을 분석해 볼까요?</p>
          <UploadPage />
        </div>
      </main>

      {shareItem && <ShareDialog item={shareItem} onClose={() => setShareItem(null)} />}
    </div>
  );
}
