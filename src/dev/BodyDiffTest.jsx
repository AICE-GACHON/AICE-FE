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
// 접근: 개발 서버에서 /dev/body-diff. 이 라우트는 routes/index.jsx에서 import.meta.env.DEV로
// 감싸 두어 배포 번들에는 들어가지 않는다 — 검증이 끝나면 이 파일과 그 라우트를 함께 지운다.
//
// 문단·미디어 매칭 로직은 실 서비스 통합판(BodyDiffPanel.jsx)과
// bodyDiff.js 하나를 공유한다 — 같은 규칙을 두 곳에서 따로 구현하면 어긋나기 쉽다.
import { useMemo, useState } from 'react';
import { getPaperRevisionsBodyDiff } from '@/services/papers';
import { buildVersionBlocks, splitSegmentsWithMedia, withSpacing } from '@/features/workspace/story/bodyDiff';

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
    if (block.noPdfChange) {
      return (
        <p style={{ color: '#888' }}>
          이 리비전은 PDF 파일을 다시 올리지 않고 제목·초록 같은 메타데이터만
          고쳤습니다 — PDF 자체는 그대로라 본문에서 비교할 게 없습니다
          (title/abstract/keywords 변경은 /revisions 쪽 title/abstract diff에서
          이미 다룹니다).
        </p>
      );
    }
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

              {(current.pdfLinks?.beforeUrl || current.pdfLinks?.afterUrl) && (
                <div style={{ display: 'flex', gap: 14, marginBottom: 10, paddingBottom: 10, borderBottom: '1px dashed #ddd' }}>
                  {current.pdfLinks.beforeUrl && (
                    <a href={current.pdfLinks.beforeUrl} target="_blank" rel="noopener noreferrer">
                      v{selected} 원문 PDF 열기 ↗
                    </a>
                  )}
                  {current.pdfLinks.afterUrl && (
                    <a href={current.pdfLinks.afterUrl} target="_blank" rel="noopener noreferrer">
                      {current.noPdfChange
                        ? '현재 PDF 열기 (이 리비전에서는 안 바뀜) ↗'
                        : `v${selected + 1} 원문 PDF 열기 ↗`}
                    </a>
                  )}
                </div>
              )}

              <VersionText block={current} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
