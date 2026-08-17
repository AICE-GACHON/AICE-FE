import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ResultReport from '@/features/workspace/ResultReport';
import PaperDetail from '@/features/workspace/report/PaperDetail';
import { MOCK_REPORT } from '@/services/mocks/mockReport';

// 랜딩 페이지의 "Try it" 데모 — 실제 결과 화면과 **똑같은** ResultReport/PaperDetail을
// 그대로 렌더링한다(다른 곳에서 쓰는 개별 하위 컴포넌트를 손으로 다시 조립하지
// 않는다). 그래야 결과 화면이 나중에 또 바뀌어도 여기가 따로 낡을 일이 없다 —
// 실제로 SelectedPapers.jsx를 손으로 이어붙였던 예전 버전이 그렇게 낡아서, "이게
// 실제 화면이다"라는 문구가 어느 순간부터 거짓이 됐었다.
//
// mockReport.js는 실제 LoRA 논문(arXiv 2106.09685) 응답을 캡처한 것이라, 논문을
// 열면 실제 PaperDetail이 GET /api/papers/{id}/story(공개 API)를 그대로 부른다.
//
// 논문 상세는 ResultReport 안(=.sim-demo 박스, 720px)에서 열지 않는다. PaperDetail의
// 2단 레이아웃(.pd-columns)은 창 너비 999px 밑에서만 1단으로 접히는데(뷰포트
// 기준 미디어쿼리라 "이 박스가 좁다"는 건 모른다), 일반 데스크톱 화면에서는
// 그 접힘이 전혀 발동을 안 해서 720px 박스에 "왼쪽 264px + 오른쪽 440px"가
// 우겨넣어져 본문 변경 이력 칸이 다 찌그러진다(실측). 그래서 paperId는 항상
// null로 고정해 ResultReport가 늘 목록만 그리게 하고, 클릭은 BodyDiffPanel의
// "⛶ 크게 보기"와 같은 방식(document.body에 portal, 뷰포트 기준 폭)으로
// 가로채 상세를 화면 전체 기준 모달로 띄운다 — 좁은 랜딩 박스 폭과 무관해진다.
export default function ReviewSimulator() {
  const [openPaperId, setOpenPaperId] = useState(null);
  const openPaper = MOCK_REPORT.selected_papers.find((p) => p.paper_id === openPaperId) ?? null;

  useEffect(() => {
    if (!openPaper) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => { if (e.key === 'Escape') setOpenPaperId(null); };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openPaper]);

  return (
    <section id="simulator">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Try it — live demo</div>
          <h2>This is the real result screen,<br />with a sample paper already analyzed</h2>
          <p>These are the reviews that similar papers actually received. Click one to open its full review timeline.</p>
        </div>

        <div className="sim-demo">
          <ResultReport
            report={MOCK_REPORT}
            paperId={null}
            onOpenPaper={setOpenPaperId}
            onClosePaper={() => setOpenPaperId(null)}
          />
        </div>
      </div>

      {openPaper && createPortal((
        <div className="sim-modal-backdrop" role="presentation" onMouseDown={() => setOpenPaperId(null)}>
          <div
            className="sim-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${openPaper.title} 상세`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <PaperDetail paper={openPaper} onBack={() => setOpenPaperId(null)} />
          </div>
        </div>
      ), document.body)}
    </section>
  );
}
