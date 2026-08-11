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

// revisions[]를 "버전 하나당 블록 하나"로 편다. revisions.length가 N이면
// 버전은 N개(baseline 1 + 그 뒤 N-1)다 — diff는 N-1개지만 블록은 N개가 맞다.
export function buildVersionBlocks(revisions) {
  return revisions.map((r, i) => {
    const mediaSource = i === 0 ? revisions[1] : r;
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
      // baseline(v1) 자신은 diff가 없어(changes=[]) 자기 pdf 링크가 없다 —
      // 바로 다음 리비전(v1→v2)의 before_url이 곧 v1 원문 파일이다.
      const nextPdf = pdfChangeOf(revisions[1]);
      return {
        label: `${r.kind_label} (baseline)`, date: r.date,
        text: ownBody ? reconstruct(ownBody.segments, 'before') : null,
        segments: null, // 원문 그대로 — diff 색칠 없음
        mediaByLabel,
        mediaByDeleted,
        pdfLinks: { beforeUrl: null, afterUrl: nextPdf?.before_url ?? null },
      };
    }
    const body = bodyChangeOf(r);
    const pdf = pdfChangeOf(r);
    return {
      label: r.kind_label, date: r.date,
      text: body ? reconstruct(body.segments, 'after') : null,
      segments: body ? body.segments : null,
      mediaByLabel,
      mediaByDeleted,
      pdfLinks: { beforeUrl: pdf?.before_url ?? null, afterUrl: pdf?.after_url ?? null },
    };
  });
}
