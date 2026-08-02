import { useState } from 'react';
import ConfidenceBanner from './report/ConfidenceBanner';
import SimilarPapers from './report/SimilarPapers';
import ReviewPatterns from './report/ReviewPatterns';
import VenueTrends from './report/VenueTrends';
import RatingContext from './report/RatingContext';
import Summary from './report/Summary';
import PaperStoryPanel from './story/PaperStoryPanel';

export default function ResultReport({ report }) {
  const [selectedPaperId, setSelectedPaperId] = useState(null);

  if (!report) return null;

  return (
    <div className="wr-stack">
      <div className="wr-card">
        <div className="wr-card-title">🔍 입력</div>
        <div className="wr-query-title">{report.query_title || <span className="wr-muted">제목 없음</span>}</div>
        <div className="wr-muted" style={{ marginTop: 6 }}>
          {(report.query_abstract || '').slice(0, 300)}
          {(report.query_abstract || '').length > 300 ? '…' : ''}
        </div>
      </div>

      <ConfidenceBanner confidence={report.confidence} />
      <SimilarPapers papers={report.similar_papers} onSelectPaper={setSelectedPaperId} />
      <ReviewPatterns patterns={report.review_patterns} neighborCount={report.similar_papers.length} />
      <VenueTrends trends={report.venue_trends} flows={report.resubmission_flows} />
      <RatingContext rc={report.rating_context} />
      <Summary markdown={report.summary_markdown} />

      {selectedPaperId != null && (
        <PaperStoryPanel key={selectedPaperId} paperId={selectedPaperId} onClose={() => setSelectedPaperId(null)} />
      )}
    </div>
  );
}
