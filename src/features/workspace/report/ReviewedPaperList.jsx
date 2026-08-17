import { decisionLabel, decisionTone } from './decision';

// 목록 화면의 본론 — 선정된 논문 표 + 총 리뷰 요약.
//
// 카드가 아니라 **표**다. 5편을 고르는 일은 비교이고, 비교는 같은 값이 같은
// 열에 세로로 정렬돼야 성립한다. 카드로 늘어놓으면 수정 횟수가 매번 다른
// 자리에 있어서 "어느 게 많이 바뀌었나"를 눈이 아니라 머리로 세어야 한다.
//
// 리뷰 원문을 여기 펼치지 않는 이유도 같다: 5편 × 리뷰 4건이면 스무 덩어리가
// 쌓여 무엇부터 읽어야 할지 알 수 없다. 표는 "어느 논문을 볼지" 고르는 자리다.

const CONFIDENCE_LABEL = {
  high: ['확실', '공유하는 내용이 논문에서 분명하게 드러남'],
  medium: ['보통', '비슷하지만 일부만 겹침'],
  low: ['참고', '느슨하게 관련됨'],
};

export default function ReviewedPaperList({ papers, summary, reviewCount, onOpen, candidatePool }) {
  if (!papers?.length) return null;

  return (
    <>
      <div className="wr-card wr-card-flush">
        <div className="wr-card-head">
          <span className="wr-card-title">비슷한 논문 {papers.length}편</span>
          <span className="wr-card-head-meta">SELECTED BY 검색 순위 · 본문 대조</span>
        </div>

        {/* 열 이름 줄. 화면에 보이는 표이므로 시맨틱 table 대신 grid를 쓰되,
            제목 열만 늘어나고 수치 열은 고정 폭이라 자릿수가 흔들리지 않는다. */}
        <div className="rp-row rp-row-head">
          <span>#</span>
          <span>TITLE</span>
          <span>VENUE</span>
          <span className="rp-num">본문 수정</span>
          <span className="rp-num">리뷰</span>
          <span className="rp-num">최종 결과</span>
          <span />
        </div>

        <ol className="rp-table">
          {papers.map((p) => {
            const conf = CONFIDENCE_LABEL[p.confidence] ?? CONFIDENCE_LABEL.low;
            const splitOpinion = p.rating_spread != null && p.rating_spread >= 3;
            const tone = decisionTone(p.decision);
            return (
              <li key={p.paper_id}>
                <button
                  type="button"
                  className={`rp-row rp-row-item${tone === 'reject' || tone === 'withdrawn' ? ' is-negative' : ''}`}
                  onClick={() => onOpen(p.paper_id)}
                >
                  <span className="rp-rank">{String(p.rank).padStart(2, '0')}</span>
                  <span className="rp-main">
                    <span className="rp-title">{p.title}</span>
                    <span className="rp-sub">
                      <span className="wr-match-badge" title={conf[1]}>{conf[0]}</span>
                      {splitOpinion && (
                        <span className="wr-split-badge"
                              title={`리뷰어 점수가 ${p.rating_spread}점 차로 갈렸어요`}>
                          의견 갈림
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="rp-venue">{p.venue}</span>
                  {/* 이 서비스가 답하려는 건 "리뷰를 받고 무엇을 고쳤나"라, 표에서
                      먼저 눈에 걸려야 하는 건 점수가 아니라 고친 횟수다. 0회는
                      숫자가 아니라 "없음"으로 쓴다 — "0회"는 자릿수만 맞을 뿐
                      "안 고쳤다"는 사실이 눈에 안 들어온다. */}
                  <span className={`rp-num rp-revisions${p.revision_count ? '' : ' is-none'}`}
                        title={REVISION_HINT}>
                    {revisionLabel(p.revision_count)}
                  </span>
                  <span className="rp-num rp-count">{p.rating_count ?? '—'}</span>
                  {/* 클래스를 따로 다는 이유: 좁은 화면에서 이 칸만 제목 아래로
                      내려보내야 하는데, 형제가 전부 span이라 nth-of-type으로는
                      집어낼 수 없다(타입을 세지 클래스를 세지 않는다). */}
                  <span className="rp-num rp-decision">
                    <span className={`ws-chip ${tone}`}>{decisionLabel(p.decision)}</span>
                  </span>
                  <span className="rp-chev" aria-hidden="true">›</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* 요약과 후보 풀은 표 아래 나란히 — 하나는 "무엇을 읽었나"의 결론이고
          다른 하나는 "그 앞에 무엇이 있었나"의 근거라, 같은 높이에 둔다. */}
      {(summary || candidatePool) && (
        <div className="rp-result-grid">
          {summary && (
            <div className="wr-card">
              <div className="wr-card-head" style={{ padding: '0 0 12px' }}>
                <span className="wr-card-title">총 리뷰 요약</span>
                <span className="wr-card-head-meta">
                  {reviewCount} REVIEWS · {papers.length} PAPERS
                </span>
              </div>
              <div className="wr-summary">{summary}</div>
            </div>
          )}
          {candidatePool}
        </div>
      )}
    </>
  );
}

const REVISION_HINT = '저자가 본문 PDF를 다시 올린 횟수 — 제목을 눌러 무엇이 바뀌었는지 볼 수 있어요';

/** 수정 횟수 표시. null("볼 수 없다" — 2023년 이전 학회는 수정 이력이 비공개)과
 *  0("확인해 보니 안 고쳤다")은 서로 다른 사실이라 절대 같이 그리지 않는다. */
function revisionLabel(count) {
  if (count == null) return '—';
  if (count === 0) return '없음';
  return `${count}회`;
}
