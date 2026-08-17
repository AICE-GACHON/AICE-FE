// 딥그린 레일 + 작업 영역, 두 칸짜리 콘솔 껍데기.
//
// 원래 이 레일은 홈(HomeDashboard) 안에만 있었다. 그런데 레일이 하는 일은
// "다른 분석으로 갈아타기"이고, 그게 가장 필요한 자리는 결과를 다 읽고 난
// 뒤다 — 홈에만 있으면 결과 화면에서 이력을 보려고 한 번 홈으로 나갔다가
// 다시 들어와야 했다. 그래서 껍데기로 올려 /app 화면들이 같이 쓴다.
//
// 이력 목록 자체는 SubmissionsProvider가 라우터 전체 위에서 들고 있다 — 분석
// 이력 페이지(PapersPage)에서 지운 게 여기 사이드바에도 곧바로 반영되려면 두
// 화면이 같은 배열을 봐야 하기 때문이다. 접힘 상태는 이 컴포넌트 자신이 들고
// 있다 — 홈(/)과 /app은 서로 다른 라우트라 옮겨 다니면 이 컴포넌트가 다시
// 마운트되는데, 접어둔 건 그 화면에서의 선택이라 초기화되는 편이 맞다.
//
// 고정·파일(폴더)·이름 바꾸기·공유는 front 브랜치에서 옮겨온 기능이다. 그쪽은
// 레일이 아직 HomeDashboard 안에 있던 시절이라 그 파일에 붙어 있었는데, 레일이
// 껍데기로 올라온 지금은 여기가 그 자리다 — 홈에만 두면 결과를 읽다가 방금 본
// 분석을 고정하거나 파일에 넣으려고 홈까지 돌아가야 한다.
//
// ⚠️ 고정/파일/이동/이름은 **프론트 localStorage에만** 저장된다(organizeStore).
// 백엔드 엔드포인트가 생기면 organizeStore와 아래 호출부만 API로 갈아끼우면 된다
// (→ docs/BACKEND_요청_사이드바_정리.md).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandMark from '@/components/BrandMark';
import { useAuth } from '@/features/auth/authContext';
import { useSubmissionsHistory } from '@/features/workspace/submissionsContext';
import { useOrganize } from '@/features/workspace/organizeStore';
import ShareDialog from '@/features/workspace/ShareDialog';

const DRAG_MIME = 'application/x-pair-submission';

/** "2026-08-16" — 레일은 좁아서 시각까지 넣으면 제목이 밀린다. */
function shortDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
}

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

// 로그아웃은 signOut만 부른다. 보호 구역(/app) 안에서 눌러도 로그인 폼으로
// 튕기지 않는다 — 어디로 보낼지는 RequireAuth가 signedOut을 보고 정한다
// (guards.jsx). 여기서 navigate를 곁들이면 그 판단과 순서 경쟁만 붙는다.
export default function ConsoleLayout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  // allSubmissions로 부른다 — org.folders.map() 안에서 "이 파일에 든 항목"을
  // 가리키는 지역 변수 items와 이름이 겹치면 헷갈린다.
  const { items: allSubmissions, status, removeSubmission } = useSubmissionsHistory();

  const userKey = user?.user_id || user?.email || 'anon';
  const org = useOrganize(userKey);

  // UI 상태: 열린 메뉴 / 공유 대상 / 이름 바꾸는 항목 / 새 폴더 입력 / 드래그 오버 폴더
  const [menuFor, setMenuFor] = useState(null);       // submission_id 또는 `folder:${id}`
  const [shareItem, setShareItem] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [newFolder, setNewFolder] = useState(false);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [openFolders, setOpenFolders] = useState({}); // folderId -> bool(펼침)
  const menuRef = useRef(null);

  // 메뉴는 이력 목록(스크롤 영역) 안에서 열린다 — 목록 끝쪽 항목일수록 메뉴가
  // 레일 아래로 삐져나간다(마지막 줄에서 255px이 잘렸다, 실측). 열린 직후
  // 스크롤을 최소한만 움직여 메뉴 전체를 보이게 한다. block:'nearest'라 이미
  // 다 보이는 경우에는 아무것도 안 움직인다.
  useEffect(() => {
    if (!menuFor) return;
    menuRef.current?.scrollIntoView({ block: 'nearest' });
  }, [menuFor]);

  const nickname = user?.nickname || '사용자';
  // 이름을 바꾼 항목은 그 이름으로 부른다 — 서버 제목은 그대로 두고 표시만 덮는다.
  const titleOf = (s) => org.titles[s.submission_id] || s.title || '제목 없음';

  // 섹션 분류: 고정됨 → 파일별 → 나머지(분석 이력). 검색은 그 앞에서 한 번 거른다.
  const { pinned, byFolder, loose } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = allSubmissions.filter((s) => !q || titleOf(s).toLowerCase().includes(q));
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
  }, [allSubmissions, org.pinned, org.folders, org.membership, org.titles, query]);

  async function handleDelete(s) {
    if (!window.confirm(`"${titleOf(s)}"을(를) 삭제할까요? 분석 결과도 함께 지워집니다.`)) return;
    setMenuFor(null);
    try {
      await removeSubmission(s.submission_id);
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
      if (folderId) setOpenFolders((o) => ({ ...o, [folderId]: true }));
    }
    setDragOverFolder(null);
  }

  // 이력 한 줄. 제목 + 모노 메타 두 줄짜리 항목은 그대로 두고(같은 제목의
  // 재분석이 여러 건일 때 날짜가 유일한 단서다), 그 줄을 감싸 "⋯" 메뉴와
  // 드래그만 얹는다.
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
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_MIME, id);
                e.dataTransfer.setData('text/plain', id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onClick={() => navigate(`/app/papers/${id}`)}
              title={titleOf(s)}
            >
              <span className="home-side-item-title">
                {isPinned && <PinIcon className="home-side-pin" />}
                {titleOf(s)}
              </span>
              <span className="home-side-item-meta">
                {shortDate(s.created_at)}{s.field ? ` · ${s.field}` : ''}
              </span>
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
            <div className="home-menu" role="menu" ref={menuRef}>
              <button type="button" className="home-menu-item" onClick={() => { setShareItem(s); setMenuFor(null); }}>
                <span className="home-menu-ico">↗</span>공유하기
              </button>
              <button type="button" className="home-menu-item" onClick={() => { setRenamingId(id); setMenuFor(null); }}>
                <span className="home-menu-ico">✎</span>이름 바꾸기
              </button>
              <button type="button" className="home-menu-item" onClick={() => { org.togglePin(id); setMenuFor(null); }}>
                <PinIcon className="home-menu-ico" />{isPinned ? '고정 해제' : '고정하기'}
              </button>

              <div className="home-menu-sep" />
              <div className="home-menu-label">파일로 이동</div>
              {org.folders.length === 0 && <div className="home-menu-hint">아직 파일이 없어요</div>}
              {org.folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="home-menu-item is-sub"
                  onClick={() => {
                    org.moveToFolder(id, f.id);
                    setOpenFolders((o) => ({ ...o, [f.id]: true }));
                    setMenuFor(null);
                  }}
                >
                  <span className="home-menu-ico">🗂</span>{f.name}
                </button>
              ))}
              <button
                type="button"
                className="home-menu-item is-sub"
                onClick={() => {
                  const f = org.createFolder('새 파일');
                  org.moveToFolder(id, f.id);
                  setOpenFolders((o) => ({ ...o, [f.id]: true }));
                  setMenuFor(null);
                }}
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

  const ready = status === 'ready';

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
          {status === 'loading' && <p className="home-side-empty">불러오는 중…</p>}
          {status === 'error' && <p className="home-side-empty">불러오지 못했어요.</p>}

          {/* 고정됨 — 하나도 없으면 줄 자체를 안 그린다. 빈 섹션은 자리만 먹는다. */}
          {ready && pinned.length > 0 && (
            <>
              <div className="home-side-section"><span>고정됨 · {pinned.length}</span></div>
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
                        onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === `folder:${f.id}` ? null : `folder:${f.id}`); }}
                      >
                        ⋯
                      </button>
                      {menuFor === `folder:${f.id}` && (
                        <>
                          <div className="home-menu-scrim" onClick={() => setMenuFor(null)} />
                          <div className="home-menu" role="menu" ref={menuRef}>
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

          {/* 분석 이력 — 고정·파일에 속하지 않은 나머지. 개수는 아래 목록에 실제로
              보이는 수를 쓴다(전체 건수를 적으면 표시된 줄 수와 어긋난다). */}
          {ready && (
            <div
              className={`home-side-loose${dragOverFolder === '__loose__' ? ' is-drop' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverFolder('__loose__'); }}
              onDragLeave={() => setDragOverFolder((cur) => (cur === '__loose__' ? null : cur))}
              onDrop={(e) => handleDropOnFolder(e, null)}
            >
              <div className="home-side-section">
                <span>분석 이력 · {loose.length}</span>
                <Link to="/app/papers" className="txt-link home-side-all">전체</Link>
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

      <main className="home-main">{children}</main>

      {shareItem && <ShareDialog item={shareItem} onClose={() => setShareItem(null)} />}
    </div>
  );
}
