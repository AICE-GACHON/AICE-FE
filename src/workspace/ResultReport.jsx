import { useState } from 'react';
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
export default function ResultReport({ report, onReset }) {
  const [openPaperId, setOpenPaperId] = useState(null);
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
        {preview && <PreviewBanner onOff={() => { setPreview(false); setOpenPaperId(null); }} />}
        <PaperDetail
          paper={openPaper}
          useMock={preview}
          onBack={() => setOpenPaperId(null)}
          onReset={onReset}
        />
      </>
    );
  }

  return (
    <div className="wr-stack">
      {onReset && (
        <button type="button" className="onboard-back" onClick={onReset}>← 새 논문 분석하기</button>
      )}
      <div className="wr-card">
        <div className="wr-card-title">🔍 올리신 논문</div>
        <div className="wr-query-title">{report.query_title || <span className="wr-muted">제목 없음</span>}</div>
        <div className="wr-muted" style={{ marginTop: 6 }}>
          {(report.query_abstract || '').slice(0, 300)}
          {(report.query_abstract || '').length > 300 ? '…' : ''}
        </div>
      </div>

      <ConfidenceBanner confidence={report.confidence} />
      {preview && <PreviewBanner onOff={() => setPreview(false)} />}

      {papers.length > 0 ? (
        <ReviewedPaperList
          papers={papers}
          summary={<Summary.Body markdown={report.summary_markdown} />}
          onOpen={setOpenPaperId}
        />
      ) : (
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
      )}

      {!preview && <Summary markdown={report.summary_markdown} />}
      <CandidatePool
        candidates={report.similar_papers}
        selectedIds={real.map((p) => p.paper_id)}
      />
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
