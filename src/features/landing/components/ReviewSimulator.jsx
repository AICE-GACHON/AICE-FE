import ResultReport from '@/features/workspace/ResultReport';
import { MOCK_REPORT } from '@/services/mocks/mockReport';

// 랜딩 페이지의 "Try it" 데모 — 실제 결과 화면과 **똑같은** ResultReport를 그대로
// 렌더링한다(다른 곳에서 쓰는 개별 하위 컴포넌트를 손으로 다시 조립하지 않는다).
// 그래야 결과 화면이 나중에 또 바뀌어도 여기가 따로 낡을 일이 없다 — 실제로
// SelectedPapers.jsx를 손으로 이어붙였던 예전 버전이 그렇게 낡아서, "이게 실제
// 화면이다"라는 문구가 어느 순간부터 거짓이 됐었다.
//
// onOpenPaper/onClosePaper/paperId를 안 주면 ResultReport가 자기 state로
// 논문 열기/닫기를 처리한다(UploadPage의 showMockReport 미리보기와 같은 방식) —
// 여기 페이지 안에서만 열고 닫히면 되고 주소창에 남길 필요가 없어서 그걸로 충분하다.
// mockReport.js는 실제 LoRA 논문(arXiv 2106.09685) 응답을 캡처한 것이라, 논문을
// 열면 실제 PaperDetail이 GET /api/papers/{id}/story(공개 API)를 그대로 부른다.
export default function ReviewSimulator() {
  return (
    <section id="simulator">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Try it — live demo</div>
          <h2>This is the real result screen,<br />with a sample paper already analyzed</h2>
          <p>These are the reviews that similar papers actually received. Click one to open its full review timeline.</p>
        </div>

        <div className="sim-demo">
          <ResultReport report={MOCK_REPORT} />
        </div>
      </div>
    </section>
  );
}
