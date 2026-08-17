import { useState } from 'react';
import VenueBreakdown from './VenueBreakdown';

// 검색이 뽑은 후보 전체. **결과가 아니라 근거 추적용이다** — 기본으로 접어 둔다.
//
// 보여주는 이유: 검색이 무엇을 뽑았고 그중 무엇이 골라졌는지를 사용자가 대조할 수
// 있어야 결과를 신뢰할 근거가 생긴다. 다만 이걸 '유사 논문 목록'처럼 펼쳐 두면
// 고르지 않은 논문까지 결과로 읽히므로, 선택된 것에 표시를 달고 접어 둔다.

const MATCH_LABEL = {
  both: ['의미+용어', '임베딩과 용어 양쪽에서 걸림'],
  semantic: ['의미', '접근은 비슷한데 쓰는 용어가 다름'],
  lexical: ['용어', '같은 용어를 쓰지만 접근은 다를 수 있음'],
};

export default function CandidatePool({ candidates, selectedIds }) {
  const [open, setOpen] = useState(false);
  if (!candidates?.length) return null;

  const chosen = new Set(selectedIds);
  // 눈금은 검색 순위 축이라 순위대로 서야 한다 — 서버가 순서를 보장하더라도
  // 여기서 어긋나면 축이 거짓말을 한다.
  const ranked = [...candidates].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const usedTypes = new Set(candidates.map((c) => c.match_type).filter((t) => MATCH_LABEL[t]));
  // 눈금에 실제로 칠해진 개수를 센다. selectedIds를 그냥 세면, 후보 목록에 없는
  // 논문이 선정에 끼어든 날 "5 SELECTED"라고 적어놓고 눈금은 넷만 진한 그림이
  // 된다 — 숫자와 그림이 어긋나면 둘 다 못 믿게 된다.
  const pickedInPool = ranked.filter((c) => chosen.has(c.paper_id)).length;

  return (
    // 점선 테두리 — 이 카드는 결과가 아니라 근거라는 표시다. 실선 카드들
    // 사이에 섞여 있으면 "고르지 않은 논문"까지 결과로 읽힌다.
    <div className="wr-card wr-candidate-card">
      <button
        type="button"
        className="wr-section-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="wr-card-title" style={{ margin: 0 }}>
          검색이 찾은 후보 {candidates.length}편
        </span>
        <span className="wr-section-toggle">{open ? '접기' : '펼치기'}</span>
      </button>

      {!open && (
        <p className="wr-candidate-lede">
          결과가 아니라 근거예요. 검색이 무엇을 뽑았고 그중 무엇이 골라졌는지 대조할 수 있어요.
        </p>
      )}

      {/* 검색 순위 축. 예전에는 4:46 비율 막대였는데, 비율은 "얼마나 걸러졌나"만
          말하고 정작 궁금한 "**어디서** 골랐나"는 못 말했다. 순위대로 눈금을
          세우면 검색 2위를 제치고 7위를 골랐다는 사실이 그대로 드러난다 —
          본문 대조가 검색 순위를 그냥 따라간 게 아니라는 증거이자, 따라갔다면
          그것도 보여야 하는 자리다. */}
      <div className="wr-rankstrip">
        {ranked.map((c) => {
          const picked = chosen.has(c.paper_id);
          const match = MATCH_LABEL[c.match_type];
          return (
            <span
              key={c.paper_id}
              className={`wr-rank-tick m-${c.match_type || 'none'}${picked ? ' is-picked' : ''}`}
              title={`${String(c.rank).padStart(2, '0')} · ${c.title}${match ? ` · ${match[0]}` : ''}${picked ? ' · 선택됨' : ''}`}
            />
          );
        })}
      </div>

      {/* 펼친 뒤에도 비율은 남긴다. 후보가 50편이면 화면에 열 몇 줄만 보이고
          나머지는 스크롤 밖이라, 지금 보고 있는 줄이 전체 중 어디쯤인지 알려주는
          숫자가 없으면 "몇 중 몇이 골라졌나"를 세면서 읽게 된다. */}
      <div className={`wr-candidate-ratio${open ? ' wr-candidate-ratio-open' : ''}`}>
        <span>{pickedInPool} SELECTED / {candidates.length} CANDIDATES</span>
        {/* 눈금이 왼쪽부터 1위라는 걸 알려주지 않으면 그냥 무늬로 읽힌다. */}
        <span className="wr-rankstrip-axis">검색 순위 →</span>
      </div>

      {/* 색이 무엇을 뜻하는지 — 범례 없이는 진하기 차이가 그냥 얼룩이다.
          실제로 나온 유형만 적는다. */}
      <div className="wr-rankstrip-legend">
        <span className="lg is-picked">선택됨</span>
        {['both', 'semantic', 'lexical']
          .filter((type) => usedTypes.has(type))
          .map((type) => (
            <span key={type} className={`lg m-${type}`} title={MATCH_LABEL[type][1]}>
              {MATCH_LABEL[type][0]}
            </span>
          ))}
      </div>

      {/* 순위 눈금이 "무엇이 골라졌나"라면 이 표는 "그 후보들이 어디 것인가"다 —
          같은 50편을 두 각도에서 세는 것이라 같은 카드에 둔다. 접었을 때도 보인다:
          펼치면 나오는 목록은 한 편씩 확인하는 자리고, 이 표는 그 목록을 다 읽지
          않아도 알 수 있는 요약이다. */}
      <VenueBreakdown candidates={candidates} selectedIds={selectedIds} />

      {open && (
        <div className="wr-candidate-list">
          {candidates.map((c) => {
            const match = MATCH_LABEL[c.match_type];
            return (
              <div key={c.paper_id} className={`wr-candidate${chosen.has(c.paper_id) ? ' picked' : ''}`}>
                <span className="wr-candidate-rank">{String(c.rank).padStart(2, '0')}</span>
                <span className="wr-candidate-title">{c.title}</span>
                <span className="wr-candidate-meta">
                  {c.venue}
                  {match && <span className="wr-match-badge" title={match[1]}>{match[0]}</span>}
                  {chosen.has(c.paper_id) && <span className="wr-picked-badge">선택됨</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
