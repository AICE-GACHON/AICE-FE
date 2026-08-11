// 임시 테스트 전용 페이지 — AICE-BE euichan 브랜치의 신규 엔드포인트
// GET /api/papers/{paper_id}/revisions/body-diff 수동 검증용.
//
// 블록 하나 = 버전 하나(가로 타임라인, 클릭하면 그 버전 본문이 뜬다). 그림/표는
// 본문 흐름 안의 "(그림 N)"/"(표 N)" 자리표시자를 찾아 그 위치에 실제 그림/표를
// 끼워 넣는다 — 원본 문서에서 그 자리에 있던 것과 같은 위치가 되도록.
//
// "버전1(baseline) 원문"은 서버가 따로 주지 않는다 — 첫 번째 body diff의
// segments에서 insert만 빼면 그게 그대로 '수정 전' 원문이라, 프론트에서
// 재구성한다. 그림/표도 마찬가지로 baseline엔 diff가 없으니 v2 transition의
// before쪽만 단독으로 보여준다.
//
// 접근: 개발 서버에서 /?dev=body-diff 로 열면 App.jsx가 이 화면을 띄운다.
// 프로덕션 라우팅에는 넣지 않는다 — 검증이 끝나면 이 파일과 App.jsx의 분기를 지운다.
import { useMemo, useState } from 'react';
import { getPaperRevisionsBodyDiff } from '../api/papers';

const bodyChangeOf = (r) => r?.changes.find((c) => c.field === 'body');
// 그림·표 둘 다 kind==='image'로 같은 모양이다 — 표도 find_tables()로 셀 구조를
// 뽑는 대신 그림과 똑같이 영역을 이미지로 잘라 비교한다(원본과 더 가까워서).
const mediaChangesOf = (r) => r?.changes.filter((c) => c.kind === 'image') ?? [];

// _paragraph_diff가 만드는 segment는 문단 끝에만 "\n\n"이 이미 붙어 있고, 그 안의
// 단어 단위 조각들(_word_diff 결과) 사이에는 구분자가 없다 — "across"+"16" 처럼
// 그냥 이어 붙이면 붙어버린다. 앞 조각이 이미 공백/줄바꿈으로 끝났을 때만 건너뛰고,
// 아니면 공백 하나를 넣는다 (문단 경계 앞에 스페이스가 남는 것도 이걸로 막는다).
function withSpacing(segments) {
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
const reconstruct = (segments, side) =>
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

function splitSegmentsWithMedia(segments) {
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
function buildVersionBlocks(revisions) {
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
      return {
        label: `${r.kind_label} (baseline)`, date: r.date,
        text: ownBody ? reconstruct(ownBody.segments, 'before') : null,
        segments: null, // 원문 그대로 — diff 색칠 없음
        mediaByLabel,
        mediaByDeleted,
      };
    }
    const body = bodyChangeOf(r);
    return {
      label: r.kind_label, date: r.date,
      text: body ? reconstruct(body.segments, 'after') : null,
      segments: body ? body.segments : null,
      mediaByLabel,
      mediaByDeleted,
    };
  });
}

function MediaPiece({ piece, mediaByLabel, mediaByDeleted }) {
  // delete 조각은 항상 자기 자신의(수정 전) 번호로 진짜 삭제된 그림을 찾아야
  // 한다 — mediaByLabel(수정 후 기준 키)로 찾으면 번호가 재사용됐을 때 엉뚱한
  // (재배치된) 그림을 보여준다(mediaByDeletedLabel 주석 참고).
  const media = piece.op === 'delete' ? mediaByDeleted[piece.label] : mediaByLabel[piece.label];
  if (!media) return null; // 캡션은 있는데 크롭 실패한 드문 경우 — 조용히 생략
  return (
    <div style={{ margin: '16px 0', whiteSpace: 'normal' }}>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 8 }}>
        {piece.label}
        {piece.op === 'moved' && (
          <span className="diff-moved" style={{ fontWeight: 500, fontSize: 12 }}>위치 이동됨</span>
        )}
      </div>
      <MediaImage media={media} />
    </div>
  );
}

// op별 CSS 클래스 — 빨강=삭제, 초록=추가, 파랑=위치 이동(moved). 'moved'는
// 저자가 실제로 옮기긴 했지만 내용은 한 글자도 안 바꾼 문단
// (_match_moved_paragraphs, paper_assistant/query/revisions.py) — 삭제·추가로
// 칠하면 "내용이 바뀌었다"는 오해를 주므로 구분한다. 단어 하나가 다른 단어로
//바뀐 "수정"도 별도 색 없이 그 단어만 delete+insert(빨강+초록)로 보여준다 —
// 문단째 잘못 짝지어졌을 때 노랑이 "이 둘은 확실히 대응된다"고 잘못 단정해
// 버리는 문제가 있어 뺐다.
const OP_CLASS = {
  insert: 'diff-ins', delete: 'diff-del', moved: 'diff-moved',
};
const OP_TITLE = {
  moved: '내용은 그대로, 위치만 이동됨',
};

function VersionText({ block }) {
  if (block.text == null) {
    return <p style={{ color: '#a60' }}>이 버전은 본문을 비교할 수 없습니다 (다운로드 실패·스캔본·페이지 상한 등).</p>;
  }
  const segs = block.segments ? withSpacing(block.segments) : [{ op: 'equal', text: block.text }];
  const pieces = splitSegmentsWithMedia(segs);
  return (
    <div style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
      {pieces.map((p, i) => (
        p.kind === 'text'
          ? (
            <span key={i} className={OP_CLASS[p.op]} title={OP_TITLE[p.op]}>
              {p.text}
            </span>
          )
          : <MediaPiece key={i} piece={p} mediaByLabel={block.mediaByLabel} mediaByDeleted={block.mediaByDeleted} />
      ))}
    </div>
  );
}

// 그림·표 둘 다 하이라이트 없이 전/후를 나란히 보여주기만 한다(픽셀 비교는 범위
// 밖). 표도 셀 구조로 재구성하지 않고 영역을 그대로 이미지로 잘라 비교한다 —
// find_tables()가 병합된 셀을 못 풀어 원본과 많이 달라지는 것보다 낫다.
function MediaImage({ media }) {
  if (media.single) {
    return media.before
      ? <img src={media.before} alt={media.label} style={{ maxWidth: '100%', border: '1px solid #eee' }} />
      : <p style={{ color: '#888' }}>이미지 없음</p>;
  }
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 260px' }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>수정 전</div>
        {media.before
          ? <img src={media.before} alt="" style={{ maxWidth: '100%', border: '1px solid #eee' }} />
          : <p style={{ color: '#888' }}>(없음 — 새로 추가됨)</p>}
      </div>
      <div style={{ flex: '1 1 260px' }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>수정 후</div>
        {media.after
          ? <img src={media.after} alt="" style={{ maxWidth: '100%', border: '1px solid #eee' }} />
          : <p style={{ color: '#888' }}>(없음 — 삭제됨)</p>}
      </div>
    </div>
  );
}

export default function BodyDiffTest() {
  const [paperId, setPaperId] = useState('23091');
  const [phase, setPhase] = useState('idle'); // idle | loading | done | error
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsedMs, setElapsedMs] = useState(null);
  const [selected, setSelected] = useState(0);

  const versionBlocks = useMemo(
    () => (data ? buildVersionBlocks(data.revisions) : []),
    [data],
  );

  const run = async () => {
    setPhase('loading');
    setErrorMsg('');
    setSelected(0);
    const started = performance.now();
    try {
      const result = await getPaperRevisionsBodyDiff(paperId);
      setData(result);
      setElapsedMs(Math.round(performance.now() - started));
      setPhase('done');
    } catch (err) {
      setErrorMsg(err.message || '알 수 없는 오류');
      setPhase('error');
    }
  };

  const current = versionBlocks[selected];

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <h1>본문/그림/표 diff 테스트 (/revisions/body-diff)</h1>
      <p style={{ color: '#666' }}>
        AICE-BE euichan 브랜치 신규 기능 수동 검증용 임시 페이지입니다.
      </p>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <input
          value={paperId}
          onChange={(e) => setPaperId(e.target.value)}
          placeholder="paper_id"
          style={{ padding: 8, fontSize: 16, width: 140 }}
        />
        <button type="button" onClick={run} disabled={phase === 'loading'} style={{ padding: '8px 16px' }}>
          {phase === 'loading' ? '불러오는 중…' : '조회'}
        </button>
      </div>

      {phase === 'error' && <p style={{ color: 'crimson' }}>{errorMsg}</p>}

      {phase === 'done' && data && (
        <div>
          <p>
            <b>{data.openreview_id}</b> · supported={String(data.supported)} · 버전={versionBlocks.length}개
            {elapsedMs != null && <> · {elapsedMs}ms{data.cached_at ? ' (캐시)' : ' (새로 계산)'}</>}
          </p>
          {data.message && <p style={{ color: '#a60' }}>{data.message}</p>}

          {/* 가로 타임라인 — 블록 하나 = 버전 하나 */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 12px' }}>
            {versionBlocks.map((b, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                style={{
                  flex: '0 0 auto', padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  border: i === selected ? '2px solid #333' : '1px solid #ccc',
                  background: i === selected ? '#f0f0f0' : '#fff',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 600 }}>v{i + 1}{i === 0 && ' (수정 전 원문)'}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{b.label} · {b.date}</div>
              </button>
            ))}
          </div>

          {current && (
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                v{selected + 1} · {current.label} · {current.date}
                {selected > 0 && ' — 이전 버전 대비 변경(초록=추가, 빨강=삭제)'}
              </div>
              <VersionText block={current} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
