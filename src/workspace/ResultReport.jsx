import { useState } from 'react';
import ConfidenceBanner from './report/ConfidenceBanner';
import SelectedPapers from './report/SelectedPapers';
import CandidatePool from './report/CandidatePool';
import Summary from './report/Summary';
import PaperStoryPanel from './story/PaperStoryPanel';

// 화면 순서가 곧 이 서비스가 하는 말의 순서다:
//   무엇을 올렸나 → 이 결과를 믿어도 되나 → 비슷한 논문이 받은 리뷰 → 종합 → (근거) 후보
//
// 통계 레이어(지적 패턴 lift·학회 경향·점수 분포)는 사라졌다. 5편 위에서는 그 통계가
// 무의미하고, 남는 가치는 그 5편의 리뷰 원문이다.
export default function ResultReport({ report }) {
  const [selectedPaperId, setSelectedPaperId] = useState(null);

  if (!report) return null;

  const selected = report.selected_papers ?? [];

  return (
    <div className="wr-stack">
      <div className="wr-card">
        <div className="wr-card-title">🔍 올리신 논문</div>
        <div className="wr-query-title">{report.query_title || <span className="wr-muted">제목 없음</span>}</div>
        <div className="wr-muted" style={{ marginTop: 6 }}>
          {(report.query_abstract || '').slice(0, 300)}
          {(report.query_abstract || '').length > 300 ? '…' : ''}
        </div>
      </div>

      <ConfidenceBanner confidence={report.confidence} />
      <SelectedPapers papers={selected} onOpenStory={setSelectedPaperId} />
      <Summary markdown={report.summary_markdown} />
      <CandidatePool
        candidates={report.similar_papers}
        selectedIds={selected.map((p) => p.paper_id)}
      />

      {selectedPaperId != null && (
        <PaperStoryPanel key={selectedPaperId} paperId={selectedPaperId} onClose={() => setSelectedPaperId(null)} />
      )}
    </div>
  );
}
