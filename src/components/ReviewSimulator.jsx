import { useState } from 'react';
import SimilarPapers from '../workspace/report/SimilarPapers';
import ReviewPatterns from '../workspace/report/ReviewPatterns';
import PaperStoryPanel from '../workspace/story/PaperStoryPanel';
import { MOCK_REPORT } from '../workspace/mockReport';

// 랜딩 페이지의 "Try it" 데모 — 실제 결과 화면과 같은 컴포넌트를 그대로 재사용한다.
// 진짜 데이터가 아니라 mockReport.js(캡처한 실제 응답 기반)를 보여주지만, 논문을
// 클릭하면 실제 PaperStoryPanel이 뜬다(로그인 없이도 GET /api/papers/{id}/story는
// 공개 API라 동작).
export default function ReviewSimulator() {
  const [selectedPaperId, setSelectedPaperId] = useState(null);

  return (
    <section id="simulator">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Try it — live demo</div>
          <h2>This is the real result screen,<br />with a sample paper already analyzed</h2>
          <p>Click a paper below to open its actual review timeline — this is the same panel you'll see with your own draft.</p>
        </div>

        <div className="sim-demo wr-stack">
          <SimilarPapers papers={MOCK_REPORT.similar_papers} onSelectPaper={setSelectedPaperId} />
          <ReviewPatterns patterns={MOCK_REPORT.review_patterns} neighborCount={MOCK_REPORT.similar_papers.length} />
        </div>

        {selectedPaperId != null && (
          <PaperStoryPanel key={selectedPaperId} paperId={selectedPaperId} onClose={() => setSelectedPaperId(null)} />
        )}
      </div>
    </section>
  );
}
