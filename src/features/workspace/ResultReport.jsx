import { useState } from 'react';
import AppliedPreferences from './report/AppliedPreferences';
import ConfidenceBanner from './report/ConfidenceBanner';
import ReviewedPaperList from './report/ReviewedPaperList';
import PaperDetail from './report/PaperDetail';
import CandidatePool from './report/CandidatePool';
import Summary from './report/Summary';
import { MOCK_SELECTED_PAPERS } from './report/mockSelectedPapers';

// 화면이 두 장이다.
//   목록: 무엇을 올렸나 → 믿어도 되나 → 총 요약 → 총 리뷰 요약 → 선정 논문 제목 5편
//   상세: 논문 하나가 리뷰를 받고 무엇을 고쳤는지 (제목 클릭 시)
//
// 리뷰 원문을 목록에 펼쳐두지 않는 이유: 5편 × 리뷰 4건이면 한 화면에 스무 덩어리가
// 쌓여 무엇부터 읽어야 할지 알 수 없다. 목록은 "어느 논문을 볼지" 고르는 자리다.
//
// 목록 ↔ 상세 전환은 openPaperId·onOpenPaper·onClosePaper로 "제어"할 수 있다 —
// 실 서비스에서는 routes/index.jsx의 ReportRoute가 이걸 URL(/app/report/:paperId)에
// 묶어서 브라우저 뒤로가기가 되게 한다. 이 prop들을 안 주면(개발용 더미 데이터 미리보기 등)
// 예전처럼 컴포넌트 안 state로만 돌아간다 — 그런 곳까지 라우팅에 묶을 필요는 없어서다.
export default function ResultReport({
  report, onReset, resetLabel = '← 새로운 논문 분석하기', paperId: controlledPaperId, onOpenPaper, onClosePaper,
}) {
  const isControlled = onOpenPaper != null;
  const [localOpenId, setLocalOpenId] = useState(null);
  const openPaperId = isControlled ? controlledPaperId : localOpenId;
  const openPaperById = isControlled ? onOpenPaper : setLocalOpenId;
  const closePaper = isControlled ? onClosePaper : () => setLocalOpenId(null);
  // 백엔드가 아직 selected_papers를 못 내려줄 때 골격을 확인하기 위한 미리보기.
  // **자동으로 켜지지 않는다** — 빈 결과를 가짜로 채우면 "비슷한 논문의 리뷰"라는
  // 약속이 거짓이 되므로, 사용자가 직접 누를 때만 켜지고 경고가 계속 떠 있는다.
  const [preview, setPreview] = useState(false);

  if (!report) return null;

  const real = report.selected_papers ?? [];
  const papers = preview ? MOCK_SELECTED_PAPERS : real;
  const openPaper = papers.find((p) => p.paper_id === openPaperId) ?? null;

  if (openPaper) {
    return (
      <>
        {preview && <PreviewBanner onOff={() => { setPreview(false); closePaper(); }} />}
        <PaperDetail
          paper={openPaper}
          useMock={preview}
          onBack={closePaper}
        />
      </>
    );
  }

  // 리뷰 총계는 선정 논문에서 직접 센다 — 서버가 따로 내려주지 않고, 표 위의
  // 요약 수치가 표의 합과 어긋나면 둘 중 어느 쪽도 못 믿게 된다.
  const reviewCount = papers.reduce((sum, p) => sum + (p.rating_count || 0), 0);

  return (
    <div className="wr-stack">
      <div className="ws-backrow">
        {onReset && (
          <button type="button" className="onboard-back" onClick={onReset}>{resetLabel}</button>
        )}
        <span className="ws-backrow-meta">
          {papers.length > 0 ? `${papers.length} PAPERS · ${reviewCount} REVIEWS` : 'NO MATCH'}
        </span>
      </div>

      {/* 머리 카드 — 무엇을 올렸고 그 결과가 몇 건인가. 수치를 오른쪽에 세로선으로
          나눠 세우면 제목과 겨루지 않으면서 한눈에 잡힌다. */}
      <div className="wr-card rp-query-card">
        <div className="rp-query-main">
          <div className="mono-label">QUERY PAPER</div>
          <div className="rp-query-title">
            {report.query_title || <span className="wr-muted">제목 없음</span>}
          </div>
          {report.query_abstract && (
            <div className="rp-query-abstract">
              {report.query_abstract.slice(0, 300)}
              {report.query_abstract.length > 300 ? '…' : ''}
            </div>
          )}
          {/* 온보딩 답변이 이 결과에 실제로 반영됐다는 유일한 표시. 기본값이면
              아무것도 그리지 않는다 (AppliedPreferences 주석 참고). */}
          <AppliedPreferences preferences={report.preferences} />
        </div>
        <div className="rp-stats">
          <div className="rp-stat">
            <div className="mono-label">MATCHED</div>
            <div className="rp-stat-value">{papers.length}</div>
          </div>
          <div className="rp-stat">
            <div className="mono-label">REVIEWS</div>
            <div className="rp-stat-value">{reviewCount}</div>
          </div>
        </div>
      </div>

      <ConfidenceBanner confidence={report.confidence} />
      {preview && <PreviewBanner onOff={() => setPreview(false)} />}

      {papers.length > 0 ? (
        <ReviewedPaperList
          papers={papers}
          summary={<Summary.Body markdown={report.summary_markdown} />}
          reviewCount={reviewCount}
          onOpen={openPaperById}
          candidatePool={(
            <CandidatePool
              candidates={report.similar_papers}
              selectedIds={real.map((p) => p.paper_id)}
            />
          )}
        />
      ) : (
        <>
          <div className="wr-card">
            {/* 빈 목록은 실패가 아니라 답이다 — 후보로 대신 채우지 않는다. */}
            <div className="wr-card-title">비슷한 논문을 찾지 못했어요</div>
            <p className="wr-muted">
              검색에는 걸렸지만 본문을 대조해 보니 같은 문제를 다루는 논문이 아니었어요.
              코퍼스는 ICLR·NeurIPS 논문 43,000여 편이라 그 밖의 주제는 비어 있을 수 있어요.
            </p>
            <button type="button" className="rp-preview-btn" onClick={() => setPreview(true)}>
              더미 데이터로 화면 미리보기 (개발용)
            </button>
          </div>
          <CandidatePool
            candidates={report.similar_papers}
            selectedIds={real.map((p) => p.paper_id)}
          />
        </>
      )}
    </div>
  );
}

function PreviewBanner({ onOff }) {
  return (
    <div className="rp-preview-banner">
      <span>⚠️ <b>더미 데이터입니다.</b> 실제 분석 결과가 아니라 화면 골격 확인용이에요.</span>
      <button type="button" onClick={onOff}>실제 결과 보기</button>
    </div>
  );
}
