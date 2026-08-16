import ResultReport from '@/features/workspace/ResultReport';
import PaperDetail from '@/features/workspace/report/PaperDetail';
import { MOCK_SELECTED_PAPERS } from '@/features/workspace/report/mockSelectedPapers';

// 결과 화면을 백엔드·로그인 없이 열어보는 임시 진입점 (DEV 전용).
//   /dev/report        목록 (후보 순위 눈금이 여기 있다)
//   /dev/report#detail 상세
//
// 후보 50편은 여기서 지어낸 값이다. 실제 결과를 흉내 내려는 게 아니라 눈금이
// 50칸일 때 어떻게 서는지, 선택된 편이 순위 여기저기 흩어져 있을 때 제대로
// 짚이는지를 보려는 것이다. 검증이 끝나면 이 파일과 routes/index.jsx의 한 줄을
// 함께 지우면 된다.

const MATCH = ['both', 'semantic', 'lexical'];
// 학회·연도를 섞는다 — 후보 분포 표(VenueBreakdown)가 학회별로 묶고 그 안에서
// 연도를 세는지, 한 해뿐인 줄은 개수를 접는지 확인하려면 여러 해가 있어야 한다.
const VENUES = ['ICLR 2025', 'ICLR 2025', 'ICLR 2024', 'NeurIPS 2024', 'NeurIPS 2023', 'ICLR 2022'];
const candidates = Array.from({ length: 50 }, (_, i) => ({
  paper_id: 1000 + i,
  rank: i + 1,
  title: `Candidate paper ${i + 1}: Embedding Inversion and Retrieval Robustness`,
  venue: VENUES[i % VENUES.length],
  match_type: MATCH[i % 3],
}));
// 선정된 논문을 2·7·18·33위에 심는다 — 검색 순위를 그대로 따라가지 않은 경우다.
[1, 6, 17, 32].forEach((index, slot) => {
  candidates[index].paper_id = MOCK_SELECTED_PAPERS[slot].paper_id;
});

const report = {
  query_title: 'Universal Zero-shot Embedding Inversion',
  query_abstract: 'Embedding inversion, i.e., reconstructing text given its embedding and black-box access to the embedding encoder, is a fundamental problem in both NLP and security.',
  selected_papers: MOCK_SELECTED_PAPERS,
  similar_papers: candidates,
  summary_markdown: '### 비슷한 논문들에 대한 리뷰 요약\n\n검색된 논문들은 텍스트 임베딩 및 검색 시스템의 취약점을 다룬다.',
};

export default function ReportPreview() {
  // 상세 화면은 타임라인이 들어 있는 903번(Length-Induced Embedding Collapse)만
  // 더미가 있어서 그 한 편으로 고정한다.
  const detail = window.location.hash === '#detail';
  return (
    // /app 레이아웃 밖이라 표의 @container 기준을 여기서 만들어 준다 —
    // 없으면 좁은 화면 레이아웃이 아예 발동하지 않는다.
    <div style={{ padding: 24, background: 'var(--surface)', minHeight: '100vh', containerType: 'inline-size' }}>
      {detail
        ? <PaperDetail paper={MOCK_SELECTED_PAPERS[2]} useMock onBack={() => {}} />
        : <ResultReport report={report} />}
    </div>
  );
}
