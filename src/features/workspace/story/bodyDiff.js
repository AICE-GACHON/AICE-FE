// GET /api/papers/{paper_id}/revisions/body-diff 응답을 화면에 그릴 수 있는 형태로
// 바꾸는 순수 로직. src/dev/BodyDiffTest.jsx(검증용 단독 페이지)와
// BodyDiffPanel.jsx(PaperStoryPanel 통합) 둘 다 이 파일 하나를 공유한다 — 같은
// 문단·미디어 매칭 규칙을 두 곳에서 따로 구현하면 어긋나기 쉽다.

export const bodyChangeOf = (r) => r?.changes.find((c) => c.field === 'body');
// 그림·표 둘 다 kind==='image'로 같은 모양이다 — 표도 find_tables()로 셀 구조를
// 뽑는 대신 그림과 똑같이 영역을 이미지로 잘라 비교한다(원본과 더 가까워서).
export const mediaChangesOf = (r) => r?.changes.filter((c) => c.kind === 'image') ?? [];
// attach_body_diffs는 body/그림/표 FieldChange를 이 pdf FieldChange 바로 뒤에
// 끼워 넣을 뿐 원본 pdf 항목 자체는 그대로 둔다(revisions.py) — before_url/
// after_url이 그 리비전에서 실제 바뀐 PDF 파일 링크다.
export const pdfChangeOf = (r) => r?.changes.find((c) => c.field === 'pdf' && c.kind === 'file');

// "v1, v2, v3..." 대신 서비스 톤에 맞는 이름. n은 1부터 시작하는 순번
// (몇 번째로 게시된 버전인지), total은 이 논문의 전체 버전 개수다. n=1은
// 리뷰를 받기 전 원본이라 "제출본", 마지막 버전은 몇 차 수정이었는지보다
// "이게 마지막"이라는 사실이 더 중요해서 "최종 수정본"으로 부른다. 그
// 사이는 "N차 수정본" — OpenReview 화면에서 저자들이 흔히 쓰는 표현이라
// 사용자에게 더 익숙하다.
export function versionLabel(n, total) {
  if (n === 1) return '최초 제출본';
  if (total != null && n === total) return '최종 수정본';
  return `${n - 1}차 수정본`;
}

// _paragraph_diff가 만드는 segment는 문단 끝에만 "\n\n"이 이미 붙어 있고, 그 안의
// 단어 단위 조각들(_word_diff 결과) 사이에는 구분자가 없다 — "across"+"16" 처럼
// 그냥 이어 붙이면 붙어버린다. 앞 조각이 이미 공백/줄바꿈으로 끝났을 때만 건너뛰고,
// 아니면 공백 하나를 넣는다 (문단 경계 앞에 스페이스가 남는 것도 이걸로 막는다).
export function withSpacing(segments) {
  const out = [];
  let prevEndsWithSpace = true;
  for (const s of segments) {
    const needsSpace = !prevEndsWithSpace && !/^\s/.test(s.text);
    const text = needsSpace ? ' ' + s.text : s.text;
    out.push({ ...s, text });
    prevEndsWithSpace = /\s$/.test(text);
  }
  return out;
}

// side='before': insert류(그때 없었던 것)를 빼면 수정 전 원문.
// side='after' : delete류(사라진 것)를 빼면 수정 후 원문.
export const reconstruct = (segments, side) =>
  withSpacing(segments.filter((s) => (side === 'before'
    ? s.op !== 'insert'
    : s.op !== 'delete')))
    .map((s) => s.text).join('');

// 본문 안의 "(그림 1)"/"(표 2)"/"(알고리즘 1)"/"(박스 a1b2c3)"/"(수식 1)" 자리표시자를
// 찾아 텍스트 조각과 미디어 조각이 섞인 목록으로 쪼갠다. extract_full_text가
// 그림/표/알고리즘/박스/수식 영역을 이 정확한 형식의 문자열로 남겨두므로
// (paper_assistant/pdf/extract.py), 텍스트 쪽은 손 댈 필요 없이 프론트에서
// 패턴만 찾으면 된다. 박스는 저자 번호가 없어 내용 해시(16진수)가 번호 자리에
// 온다 — Figure/Table/Algorithm/Equation과 캡처 그룹 구조를 다르게 둬서 구분한다.
const MEDIA_RE = /\((?:(그림|표|알고리즘|수식)\s*(\d+)|박스\s*([0-9a-f]+))\)/g;
const KIND_BY_WORD = { 그림: 'Figure', 표: 'Table', 알고리즘: 'Algorithm', 수식: 'Equation' };

export function splitSegmentsWithMedia(segments) {
  const out = [];
  for (const s of segments) {
    MEDIA_RE.lastIndex = 0;
    let lastIndex = 0;
    let m;
    while ((m = MEDIA_RE.exec(s.text))) {
      if (m.index > lastIndex) {
        out.push({ kind: 'text', op: s.op, text: s.text.slice(lastIndex, m.index) });
      }
      const [, word, num, boxHash] = m;
      const kind = word ? KIND_BY_WORD[word] : 'Box';
      out.push({ kind: kind.toLowerCase(), label: `${kind} ${word ? num : boxHash}`, op: s.op });
      lastIndex = MEDIA_RE.lastIndex;
    }
    if (lastIndex < s.text.length) {
      out.push({ kind: 'text', op: s.op, text: s.text.slice(lastIndex) });
    }
  }
  return out;
}

// 저자가 그림/표 번호를 재배치하면(예: v2의 Figure 6 -> v3의 Figure 5) 백엔드는
// 한 FieldChange에 label(수정 전 번호)과 after_label(수정 후 번호, 다를 때만)을
// 같이 담아 보낸다(paper_assistant/schemas.py). "Figure 6"라는 문자열을 한
// 그림은 수정 전 번호로, 다른 그림은 수정 후 번호로 동시에 쓰는 경우가 있어서
// (실측: v2 Figure 7도 v3에서 Figure 6가 됨) 평평한 라벨→이미지 표 하나로
// 합치면 서로 다른 두 그림이 뒤섞인다. side(수정 전/후 어느 문맥의 텍스트를
// 그리는지)에 맞는 번호로 키를 잡아야 충돌이 안 생긴다.
//
// ⚠️ **그 쪽에 실제로 존재하는 항목만 넣는다.** v3에만 새로 생긴 그림(예:
// 실측 Figure 7 신규 추가)은 before_image가 없는데, 그 label 문자열이
// 우연히 "v2에서 다른 그림의 수정 전 번호"와 같을 수 있다(실측: 새로 생긴
// Figure 7과, v2의 원래 Figure 7이 서로 다른 그림인데 같은 번호). before
// 표에 before_image 없는 항목까지 넣으면 이런 우연한 번호 일치로 진짜
// before 항목을 덮어써 버린다 — 존재 여부로 걸러야 안전하다.
function mediaByLabelForSide(source, side) {
  const out = {};
  for (const m of mediaChangesOf(source)) {
    if (side === 'before' ? !m.before_image : !m.after_image) continue;
    const key = side === 'before' ? m.label : (m.after_label ?? m.label);
    out[key] = { label: key, before: m.before_image, after: m.after_image };
  }
  return out;
}

// op==='delete' 조각은 항상 "수정 전(=이 조각 자신의) 번호" 문자열을 그대로
// 담고 있다(_merge_media_placeholders는 delete 텍스트를 절대 안 바꾼다).
// 그런데 그 번호가 "재사용"되면(실측: v1 Figure 4 삭제 → v1 Figure 5가 v2에서
// "Figure 4"가 됨) mediaByLabelForSide(source,'after')의 같은 키에는 재배치된
// 그림 쪽 항목이 들어 있다 — op을 안 가리고 label만으로 찾으면 진짜 삭제된
// 그림 대신 재배치된 그림을 잘못 보여준다. delete 전용으로 "그 번호를 원래
// label로 쓰던(=재배치 전) 항목"만 따로 찾는다 — after_image 유무는 안 따진다
// (재배치됐으면 그 항목은 moved 쪽에서 이미 처리하므로 신경 안 써도 된다).
function mediaByDeletedLabel(source) {
  const out = {};
  for (const m of mediaChangesOf(source)) {
    if (!m.before_image) continue;
    out[m.label] = { label: m.label, before: m.before_image, after: null };
  }
  return out;
}

export const MEDIA_KIND_LABELS = { figure: '그림', table: '표', algorithm: '알고리즘', equation: '수식', box: '박스' };

// 본문 렌더링(VersionText)과 요약 카운트(summarizeChanges), 변경 위치 이동
// 버튼(BodyDiffPanel)이 전부 "같은 조각을 같은 기준으로 묶은 것"을 봐야
// 서로 숫자가 어긋나지 않는다 — 그래서 조각을 그룹으로 묶는 로직을 여기
// 한 곳에만 둔다. 단어 단위로 쪼개진 연속 조각(예: 한 문장이 insert 조각
// 5개로 나뉘는 경우)을 낱개로 세면 숫자가 실제 "변경 지점"보다 훨씬 부풀어
// 보이므로, 텍스트는 같은 op가 연달아 나오는 구간을 하나로 묶는다(그림·표
// 같은 미디어는 이미 한 덩어리라 묶을 필요 없이 하나씩 그대로 센다).
// 반환하는 groupIndexOfPiece[i]는 pieces[i]가 속한 그룹 번호(equal이면
// -1) — "변경 위치로 이동" 버튼이 DOM에서 그 그룹의 첫 조각을 찾아
// scrollIntoView 하는 데 쓴다.
export function computeChangeGroups(block) {
  const segs = block.segments ? withSpacing(block.segments) : [{ op: 'equal', text: block.text ?? '' }];
  const pieces = splitSegmentsWithMedia(segs);
  const groupIndexOfPiece = new Array(pieces.length).fill(-1);
  const groups = [];

  let i = 0;
  while (i < pieces.length) {
    const p = pieces[i];
    if (p.op === 'equal') { i += 1; continue; }
    const groupIdx = groups.length;
    if (p.kind !== 'text') {
      groupIndexOfPiece[i] = groupIdx;
      groups.push({ kind: p.kind, op: p.op });
      i += 1;
      continue;
    }
    let j = i;
    while (j < pieces.length && pieces[j].kind === 'text' && pieces[j].op === p.op) {
      groupIndexOfPiece[j] = groupIdx;
      j += 1;
    }
    groups.push({ kind: 'text', op: p.op });
    i = j;
  }

  return { pieces, groupIndexOfPiece, groups };
}

// 버전 카드 목록만 보고도 "이 버전에서 대충 뭐가 얼마나 바뀌었는지" 감이
// 오게 하는 요약 카운트 — computeChangeGroups의 groups를 op/kind별로 집계만 한다.
export function summarizeChanges(block) {
  if (!block.segments) return null;
  const { groups } = computeChangeGroups(block);
  const text = { insert: 0, delete: 0, moved: 0 };
  const media = {};

  for (const g of groups) {
    if (g.kind === 'text') {
      if (g.op in text) text[g.op] += 1;
      continue;
    }
    const bucket = media[g.kind] || (media[g.kind] = { insert: 0, delete: 0, moved: 0 });
    if (g.op in bucket) bucket[g.op] += 1;
  }

  return { text, media };
}

// revisions[]를 "버전 하나당 블록 하나"로 편다. revisions.length가 N이면
// 버전은 N개(baseline 1 + 그 뒤 N-1)다 — diff는 N-1개지만 블록은 N개가 맞다.
export function buildVersionBlocks(revisions) {
  // baseline 자신은 diff가 없어(changes=[]) 자기 그림·PDF 링크가 없다 —
  // "PDF가 실제로 처음 바뀐 리비전"의 before쪽을 빌려와야 한다. 무조건
  // revisions[1](바로 다음 리비전)을 쓰면 안 된다 — 저자가 제목·초록만
  // 고친 리비전(PDF 안 바뀜)이 먼저 끼어 있으면 거기엔 그림 데이터 자체가
  // 없어서 baseline이 그림을 하나도 못 찾아온다(실측: Lotus 논문 — PDF는
  // 그대로 두고 초록만 두 번 고친 뒤에야 새 PDF를 올림). PDF 변경 자체가
  // 한 번도 없는 논문이면 undefined — 그때는 예전처럼 그림도 링크도 없다.
  const firstPdfRevision = revisions.slice(1).find((rev) => pdfChangeOf(rev));

  // PDF가 안 바뀐 리비전(noPdfChange)에서도 "지금 이 시점의 PDF가 뭔지"는
  // 알 수 있다 — 마지막으로 실제 바뀐 시점의 after_url을 그대로 들고
  // 있으면 된다. 순서대로 훑으면서 pdf FieldChange를 만날 때마다 갱신한다.
  let lastKnownPdfUrl = null;
  return revisions.map((r, i) => {
    const mediaSource = i === 0 ? firstPdfRevision : r;
    const side = i === 0 ? 'before' : 'after';
    const single = i === 0;
    const mediaByLabel = Object.fromEntries(Object.entries(mediaByLabelForSide(mediaSource, side)).map((
      [key, m]) => [key, { ...m, after: single ? null : m.after, single }]));
    const mediaByDeleted = mediaByDeletedLabel(mediaSource);

    if (i === 0) {
      // r(baseline) 자신의 body 필드를 쓴다 — v1 자신의 문단 순서로 만든
      // all-equal segments라 v1 원본과 그림·문단 위치가 완전히 같다(attach_body_diffs
      // 참고). 예전엔 revisions[1](v1→v2 diff)의 before쪽을 재구성해 썼는데,
      // 그 세그먼트는 v2 쪽 위치를 우선하도록 설계돼 있어 v1 자신을 보여줄 때
      // 문단 순서가 실제 v1 원본과 어긋나는 문제가 있었다(실측: Figure 2가
      // 엉뚱한 문단 뒤로 밀림).
      const ownBody = bodyChangeOf(r);
      const nextPdf = pdfChangeOf(firstPdfRevision);
      lastKnownPdfUrl = nextPdf?.before_url ?? null;
      return {
        label: `${r.kind_label} (baseline)`, date: r.date,
        text: ownBody ? reconstruct(ownBody.segments, 'before') : null,
        segments: null, // 원문 그대로 — diff 색칠 없음
        mediaByLabel,
        mediaByDeleted,
        pdfLinks: { beforeUrl: null, afterUrl: lastKnownPdfUrl },
        // ownBody가 없는 이유가 둘로 갈린다 — ①PDF가 정말 한 번도 안 바뀐
        // 논문(firstPdfRevision 자체가 없음, 이때가 noPdfChange)과 ②PDF는
        // 바뀌었는데 baseline 원문 추출이 실패한 경우(스캔본·다운로드 실패
        // 등, 이때는 firstPdfRevision은 있지만 ownBody가 없다 — noPdfChange
        // 아님, VersionText의 일반 경고문이 맞다).
        noPdfChange: !firstPdfRevision,
      };
    }
    const body = bodyChangeOf(r);
    const pdf = pdfChangeOf(r);
    // attach_body_diffs는 field="pdf" FieldChange가 있는 리비전에서만 body
    // diff를 계산한다(revisions.py) — 이 리비전이 제목·초록 등만 고치고
    // PDF 파일 자체는 안 바꿨으면 pdf 항목 자체가 없어 body도 당연히 없다.
    // 이건 실패가 아니라 "비교할 게 없다"는 뜻이라, 다운로드 실패·스캔본
    // 같은 진짜 실패와 구분해서 보여줘야 한다. 그래도 "지금 PDF가 뭔지"
    // 링크는 여전히 줄 수 있다 — 이 리비전에서 안 바뀌었을 뿐 마지막으로
    // 알려진 PDF(lastKnownPdfUrl)는 그대로 유효하다.
    if (pdf) {
      lastKnownPdfUrl = pdf.after_url ?? lastKnownPdfUrl;
    }
    return {
      label: r.kind_label, date: r.date,
      text: body ? reconstruct(body.segments, 'after') : null,
      segments: body ? body.segments : null,
      mediaByLabel,
      mediaByDeleted,
      pdfLinks: pdf
        ? { beforeUrl: pdf.before_url ?? null, afterUrl: pdf.after_url ?? null }
        : { beforeUrl: null, afterUrl: lastKnownPdfUrl },
      noPdfChange: !pdf,
    };
  });
}
