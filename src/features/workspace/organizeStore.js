// 분석 이력의 "정리" 상태 — 고정(pin) · 프로젝트(folder) · 이동 · 이름 바꾸기.
//
// ⚠️ **임시 프론트 전용 저장소입니다.** 지금은 이 상태를 브라우저 localStorage에만
// 저장합니다. 백엔드에 폴더 테이블과 submissions.pinned/folder_id 컬럼, 그리고 관련
// 엔드포인트가 생기면(→ docs/BACKEND_요청_사이드바_정리.md) 이 파일의 저장/로드를
// API 호출로 갈아끼우면 됩니다. UI(HomeDashboard)는 이 훅의 인터페이스만 쓰므로
// 컴포넌트는 거의 그대로 둘 수 있습니다.
//
// 사용자별로 분리 저장합니다 — 같은 브라우저를 여러 계정이 쓰면 섞이면 안 됩니다.
import { useCallback, useEffect, useMemo, useState } from 'react';

const KEY_PREFIX = 'pair.organize.';

function storageKey(userKey) {
  return `${KEY_PREFIX}${userKey || 'anon'}`;
}

const EMPTY = { pinned: [], folders: [], membership: {}, titles: {} };

function load(userKey) {
  try {
    const raw = localStorage.getItem(storageKey(userKey));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      pinned: Array.isArray(parsed.pinned) ? parsed.pinned : [],
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      membership: parsed.membership && typeof parsed.membership === 'object' ? parsed.membership : {},
      titles: parsed.titles && typeof parsed.titles === 'object' ? parsed.titles : {},
    };
  } catch {
    return EMPTY;
  }
}

let _seq = 0;
function newFolderId() {
  // localStorage 전용이라 crypto.randomUUID면 충분하다. 백엔드가 생기면 서버가 id를 준다.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `f_${crypto.randomUUID()}`;
  _seq += 1;
  return `f_${Date.now()}_${_seq}`;
}

/**
 * 사이드바 정리 상태와 그 변경 함수들을 돌려준다.
 * @param {string} userKey - 사용자 식별자(user_id 등). 계정별로 저장을 분리한다.
 */
export function useOrganize(userKey) {
  const [state, setState] = useState(() => load(userKey));
  const [loadedKey, setLoadedKey] = useState(userKey);

  // 계정이 바뀌면(로그인 전환) 그 계정의 저장분을 다시 읽는다. 렌더 중에 갱신하는
  // 것은 React가 권장하는 "prop 변화에 state 맞추기" 패턴이다(useEffect보다 낫다).
  if (loadedKey !== userKey) {
    setLoadedKey(userKey);
    setState(load(userKey));
  }

  // 어떤 변경이든 즉시 localStorage에 반영한다.
  useEffect(() => {
    try { localStorage.setItem(storageKey(userKey), JSON.stringify(state)); } catch { /* 용량 초과 등은 무시 */ }
  }, [userKey, state]);

  const togglePin = useCallback((id) => {
    setState((s) => ({
      ...s,
      pinned: s.pinned.includes(id) ? s.pinned.filter((x) => x !== id) : [...s.pinned, id],
    }));
  }, []);

  const createFolder = useCallback((name) => {
    const folder = { id: newFolderId(), name: (name || '새 파일').trim() || '새 파일' };
    setState((s) => ({ ...s, folders: [...s.folders, folder] }));
    return folder;
  }, []);

  const renameFolder = useCallback((folderId, name) => {
    const clean = (name || '').trim();
    if (!clean) return;
    setState((s) => ({
      ...s,
      folders: s.folders.map((f) => (f.id === folderId ? { ...f, name: clean } : f)),
    }));
  }, []);

  const deleteFolder = useCallback((folderId) => {
    setState((s) => {
      const membership = { ...s.membership };
      for (const [sid, fid] of Object.entries(membership)) {
        if (fid === folderId) delete membership[sid]; // 폴더만 지우고 안의 논문은 이력으로 되돌린다
      }
      return { ...s, folders: s.folders.filter((f) => f.id !== folderId), membership };
    });
  }, []);

  const moveToFolder = useCallback((id, folderId) => {
    setState((s) => {
      const membership = { ...s.membership };
      if (folderId) membership[id] = folderId;
      else delete membership[id];
      return { ...s, membership };
    });
  }, []);

  const setTitle = useCallback((id, name) => {
    const clean = (name || '').trim();
    setState((s) => {
      const titles = { ...s.titles };
      if (clean) titles[id] = clean;
      else delete titles[id];
      return { ...s, titles };
    });
  }, []);

  // 논문이 삭제되면 그와 관련된 정리 상태도 함께 지운다.
  const forget = useCallback((id) => {
    setState((s) => {
      const membership = { ...s.membership };
      const titles = { ...s.titles };
      delete membership[id];
      delete titles[id];
      return { ...s, pinned: s.pinned.filter((x) => x !== id), membership, titles };
    });
  }, []);

  return useMemo(() => ({ ...state, togglePin, createFolder, renameFolder, deleteFolder, moveToFolder, setTitle, forget }),
    [state, togglePin, createFolder, renameFolder, deleteFolder, moveToFolder, setTitle, forget]);
}
