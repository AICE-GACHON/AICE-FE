// 약관·개인정보처리방침 원문 — AICE-BE의 GET /api/legal/{document}
// (app/routers/legal.py, 원문은 app/legal/*.md).
//
//   GET /api/legal/terms    -> { document, title, version, format: 'markdown', content }
//   GET /api/legal/privacy  -> 같은 형태
//
// **인증이 없다.** 회원가입 화면이 계정을 만들기 *전에* 보여줘야 하는 문서라서,
// 토큰을 요구하면 동의를 받아야 할 바로 그 화면에서 못 읽는다.
//
// content는 마크다운이다. 서버가 HTML로 렌더하지 않는 이유는 화면마다 필요한
// 스타일이 다르고, 서버가 만든 HTML을 그대로 넣는 순간 그게 XSS 판단거리가 되기
// 때문이다 — 렌더링은 react-markdown이 한다(LegalDocumentView.jsx).

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** 서버가 아는 문서 이름. 이 밖의 값은 서버가 404를 준다. */
export const LEGAL_DOCUMENTS = ['terms', 'privacy'];

export const LEGAL_TITLES = {
  terms: '이용약관',
  privacy: '개인정보처리방침',
};

// 문서는 배포 사이에 바뀌지 않는다. 모달을 여닫을 때마다 다시 받아오면 사용자는
// 매번 로딩을 보고, 서버는 같은 문자열을 반복해서 내보낸다. 탭이 살아 있는 동안만
// 유지되므로 배포로 문서가 바뀌면 다음 방문에 자연히 새로 받는다.
const cache = new Map();

function mockDocument(document) {
  return {
    document,
    title: `${LEGAL_TITLES[document]} (미리보기 없음)`,
    version: '—',
    format: 'markdown',
    content:
      `# ${LEGAL_TITLES[document]}\n\n` +
      'VITE_API_BASE_URL이 설정되지 않아 서버에서 원문을 받아올 수 없어요.\n\n' +
      '백엔드를 띄우고 다시 열어보세요. 실제 문구는 AICE-BE의 `app/legal/` 에 있습니다.',
  };
}

/**
 * @param {'terms'|'privacy'} document
 * @returns {Promise<{document: string, title: string, version: string, format: string, content: string}>}
 */
export async function fetchLegalDocument(document) {
  if (cache.has(document)) return cache.get(document);

  // 백엔드 없이 화면만 보는 개발 모드. 빈 화면 대신 왜 안 보이는지를 보여준다 —
  // 여기서 그냥 던지면 "약관을 불러오지 못했어요"만 뜨고 원인을 알 수 없다.
  if (!BASE_URL) {
    const doc = mockDocument(document);
    cache.set(document, doc);
    return doc;
  }

  const res = await fetch(`${BASE_URL}/api/legal/${document}`);
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.success === false) {
    const err = new Error(
      body?.error?.message || `약관을 불러오지 못했어요 (${res.status})`,
    );
    err.status = res.status;
    throw err;
  }

  cache.set(document, body.data);
  return body.data;
}
