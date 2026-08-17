// 검색이 뽑은 후보가 어느 학회·어느 해에 실렸는지 세는 표.
//
// "비슷한 논문이 어디에 많나"는 투고처를 고를 때 실제로 묻는 질문이다. 다만 이
// 표가 답할 수 있는 범위는 좁다 — 코퍼스가 ICLR·NeurIPS 두 곳뿐이라 "이 주제는
// X 학회 논문이다"가 아니라 "이 검색이 뽑은 후보 안에서의 비율"이다. 그래서 그
// 문장을 표 아래에 그대로 적어 둔다. 숫자만 크게 세우고 단서를 빼면 없는 사실을
// 주장하게 된다.
//
// 학회가 한 종류뿐이면 학회별 표는 한 줄이 되어 아무 말도 못 한다. 그때는 연도로
// 나눈다 — 비슷한 논문이 2025년에 몰렸는지 2020년에 몰렸는지는 그 자체로 다른
// 이야기다(주제가 지금 뜨는 것인지 지나간 것인지).

export default function VenueBreakdown({ candidates, selectedIds }) {
  if (!candidates?.length) return null;

  const chosen = new Set(selectedIds);
  const parsed = candidates.map((c) => ({ ...splitVenue(c), picked: chosen.has(c.paper_id) }));

  const byVenue = tally(parsed, (p) => p.name);
  // 학회가 하나뿐이면 연도로 갈아탄다. 둘 다 한 줄이면 표가 셀 게 없다는 뜻이라
  // 아예 안 그린다 — "ICLR 2025 50편" 한 줄은 카드 제목이 이미 하는 말이다.
  const mode = byVenue.length > 1 ? 'venue' : 'year';
  const rows = mode === 'venue'
    ? byVenue
    : tally(parsed.filter((p) => p.year != null), (p) => String(p.year));
  if (rows.length < 2) return null;

  const max = Math.max(...rows.map((r) => r.total));

  return (
    <div className="vb">
      <div className="vb-head">
        <span className="vb-title">어디에 실렸나</span>
        <span className="vb-mode">{mode === 'venue' ? '학회별' : '연도별'}</span>
      </div>

      <div className="vb-rows">
        {rows.map((row) => (
          <div className="vb-row" key={row.key}>
            <span className="vb-name">
              {row.key}
              {/* 학회별로 묶었으면 그 안의 연도 분포를 한 줄 더 붙인다 — "ICLR 32편"
                  만으로는 옛날 논문이 몰린 건지 올해 것이 몰린 건지 알 수 없다. */}
              {mode === 'venue' && row.years && <span className="vb-years">{row.years}</span>}
            </span>
            <span className="vb-count">{row.total}</span>
            {/* 선정 0편은 '—'로 쓴다. "0"은 자릿수만 맞을 뿐 "이 학회에서는 한 편도
                안 골랐다"가 눈에 안 들어온다(결과 표의 '없음'과 같은 이유). */}
            <span className={`vb-picked${row.picked ? '' : ' is-none'}`}>
              {row.picked ? `선정 ${row.picked}` : '—'}
            </span>
            <span className="vb-bar" aria-hidden="true">
              <i style={{ width: `${(row.total / max) * 100}%` }} />
            </span>
          </div>
        ))}
      </div>

      <p className="vb-note">
        코퍼스가 ICLR·NeurIPS 두 곳이라 그 둘 사이의 비율이에요.
        전체 논문이 아니라 이 검색이 뽑은 후보 {candidates.length}편 기준이고요.
      </p>
    </div>
  );
}

/** "ICLR 2025" → { name: 'ICLR', year: 2025 }. year 필드가 오면 그쪽을 믿는다 —
 *  제목에서 뜯어낸 값보다 서버가 따로 내려준 값이 정확하다. */
function splitVenue({ venue, year }) {
  const matched = /^(.*?)[\s,]*((?:19|20)\d{2})\s*$/.exec(venue ?? '');
  return {
    name: (matched ? matched[1].trim() : (venue ?? '').trim()) || '학회 미상',
    year: year ?? (matched ? Number(matched[2]) : null),
  };
}

/** key별로 후보 수·선정 수를 세고 많은 순으로 정렬. 편수가 같을 때의 순서도
 *  정해 둔다 — 안 정하면 Map에 들어온 순서, 즉 검색 순위 우연에 따라 줄이 뒤바뀐다.
 *  연도는 최근 해가 위로(2023이 2022보다 위), 학회 이름은 가나다순. */
function tally(items, keyOf) {
  const map = new Map();
  for (const item of items) {
    const key = keyOf(item);
    const row = map.get(key) ?? { key, total: 0, picked: 0, byYear: new Map() };
    row.total += 1;
    if (item.picked) row.picked += 1;
    if (item.year != null) row.byYear.set(item.year, (row.byYear.get(item.year) ?? 0) + 1);
    map.set(key, row);
  }
  return [...map.values()]
    .map((row) => ({ ...row, years: yearLine(row.byYear) }))
    .sort((a, b) => b.total - a.total || tieBreak(a.key, b.key));
}

function tieBreak(a, b) {
  const bothYears = /^\d{4}$/.test(a) && /^\d{4}$/.test(b);
  return bothYears ? Number(b) - Number(a) : a.localeCompare(b);
}

/** "2025 ×18 · 2024 ×9" — 최근 해부터. 한 해뿐이면 개수는 접는다(줄 전체 개수와 같다). */
function yearLine(byYear) {
  if (byYear.size === 0) return null;
  const entries = [...byYear.entries()].sort((a, b) => b[0] - a[0]);
  if (entries.length === 1) return String(entries[0][0]);
  return entries.map(([year, count]) => `${year} ×${count}`).join(' · ');
}
