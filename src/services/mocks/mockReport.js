// 개발용 mock — 백엔드 없이도 결과 화면을 검증할 수 있게 하기 위한 데이터.
// VITE_API_BASE_URL이 없을 때만 쓰인다 (src/services/submissions.js).
//
// **실측 응답이다.** LoRA 논문(arXiv 2106.09685) PDF를 실제 파이프라인에 넣어
// 나온 selected_papers / summary_markdown / confidence를 옮겨 적었다. 리뷰 본문은
// 길어서 줄였다.
//
// 스키마는 paper_assistant/schemas.py의 Report다. 통계 레이어(review_patterns·
// venue_trends·rating_context·resubmission_flows)는 제거됐으니 여기에도 없다.
//
// ⚠️ 딱 하나 예외: `revision_count`는 실측이 아니다. 이 응답을 뜬 뒤에 생긴
// 필드라 값을 손으로 채웠다. 다만 **학회에 모순되지 않게** 골랐다 — ICLR 2022는
// 구 API라 수정 이력을 볼 수 없어 null이고(services/submissions.js 주석), 나머지
// 둘은 ICLR 2024라 실제 값이 나올 수 있다. 세 칸이 "—/없음/N회"를 각각 보여준다.
export const MOCK_REPORT = {
  query_title: 'LoRA: Low-Rank Adaptation of Large Language Models',
  query_abstract:
    'We propose Low-Rank Adaptation, or LoRA, which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks.',
  confidence: {
    level: 'strong',
    message: '이 주제의 논문이 코퍼스에 충분히 있습니다.',
    is_reliable: true,
    evidence: 0.9691,
  },
  selected_papers: [
    {
      paper_id: 6820,
      openreview_id: 'nZeVKeeFYf9',
      title: 'LoRA: Low-Rank Adaptation of Large Language Models',
      venue: 'ICLR 2022',
      year: 2022,
      decision: 'accept-poster',
      openreview_url: 'https://openreview.net/forum?id=nZeVKeeFYf9',
      pdf_url: 'https://openreview.net/pdf?id=nZeVKeeFYf9',
      rank: 1,
      reason: '동일한 저랭크 어댑터 기법을 제안한 논문으로, 문제 설정과 방법이 그대로 겹친다.',
      confidence: 'high',
      meta_review: 'AC: 리뷰어들이 실용적 가치에 동의했으나 어댑터 계열과의 차별점이 점진적이라는 의견이 있었다.',
      avg_rating: 7.0,
      rating_count: 4,
      rating_spread: 2.0,
      revision_count: null, // ICLR 2022 = 구 API, 이력을 볼 수 없다 → 화면은 "—"
      reviews: [
        {
          rating: 8, rating_raw: '8: Top 50% of accepted papers', confidence: 4,
          summary: null, strengths: null,
          weaknesses:
            '제안 기법은 실용적이지만 기존 어댑터 연구와 비교해 점진적입니다. 또한 최신 SOTA 모델과의 비교가 부족합니다.',
          questions: null, is_unsplit: true,
        },
        {
          rating: 6, rating_raw: '6: Marginally above acceptance threshold', confidence: 4,
          summary: null, strengths: null,
          weaknesses: '랭크 선택에 대한 민감도 분석이 더 필요해 보입니다.',
          questions: null, is_unsplit: true,
        },
      ],
    },
    {
      paper_id: 15640,
      openreview_id: 'DLJznSp6X3',
      title: 'ReLoRA: High-Rank Training Through Low-Rank Updates',
      venue: 'ICLR 2024',
      year: 2024,
      decision: 'accept-poster',
      openreview_url: 'https://openreview.net/forum?id=DLJznSp6X3',
      pdf_url: 'https://openreview.net/pdf?id=DLJznSp6X3',
      rank: 2,
      reason: '저랭크 갱신을 누적해 고랭크 학습 효과를 만드는 방식으로, LoRA를 사전학습으로 확장한다.',
      confidence: 'high',
      meta_review: 'AC: 아이디어는 흥미로우나 대형 모델로의 확장 증거가 부족하다는 지적이 반복됐다.',
      avg_rating: 5.75,
      rating_count: 4,
      rating_spread: 1.0,
      revision_count: 0, // 이력은 읽혔는데 본문은 안 고침 → 화면은 "없음"
      reviews: [
        {
          rating: 6, rating_raw: '6: marginally above the acceptance threshold', confidence: 4,
          summary: '저랭크 갱신을 반복 적용해 고랭크 학습을 근사한다.',
          strengths: '동기가 명확하고 구현이 단순합니다.',
          weaknesses: '7B~70B급 대형 모델로 확장했을 때도 같은 이득이 나오는지 확인되지 않았습니다.',
          questions: '풀랭크 베이스라인과 같은 perplexity에 도달하려면 몇 배의 학습이 더 필요한가요?',
          is_unsplit: false,
        },
      ],
    },
    {
      paper_id: 16151,
      openreview_id: 'RbKZBrPGRJ',
      title: 'LoRA-FA: Memory-efficient Low-rank Adaptation for Large Language Models',
      venue: 'ICLR 2024',
      year: 2024,
      decision: 'reject',
      openreview_url: 'https://openreview.net/forum?id=RbKZBrPGRJ',
      pdf_url: 'https://openreview.net/pdf?id=RbKZBrPGRJ',
      rank: 3,
      reason: 'LoRA의 A 행렬을 고정해 활성값 메모리를 줄이는 변형으로, 같은 분해 구조를 다룬다.',
      confidence: 'high',
      meta_review: 'AC: 메모리 절감 폭이 전체 GPU 메모리 대비 크지 않다는 지적에 저자가 충분히 답하지 못했다.',
      avg_rating: 5.33,
      rating_count: 3,
      rating_spread: 1.0,
      revision_count: 3, // 본문 PDF를 세 번 갈아끼움 → 화면은 "3회"
      reviews: [
        {
          rating: 5, rating_raw: '5: marginally below the acceptance threshold', confidence: 4,
          summary: 'LoRA의 down-projection을 고정한다.',
          strengths: '메모리 측정이 구체적입니다.',
          weaknesses: 'A를 고정한다는 점 외에 LoRA와의 차이가 없어 novelty가 제한적입니다.',
          questions: null, is_unsplit: false,
        },
      ],
    },
  ],
  similar_papers: [
    { paper_id: 24170, openreview_id: 'a1b', title: 'LoRA-XS: Low-Rank Adaptation with Extremely Small Number of Parameters', venue: 'ICLR 2025', year: 2025, decision: 'reject', rank: 1, match_type: 'both' },
    { paper_id: 26025, openreview_id: 'a2b', title: 'Train Small, Infer Large: Memory-Efficient LoRA Training', venue: 'ICLR 2025', year: 2025, decision: 'accept-poster', rank: 2, match_type: 'both' },
    { paper_id: 21254, openreview_id: 'a3b', title: 'LoRA vs Full Fine-tuning: An Illusion of Equivalence', venue: 'ICLR 2025', year: 2025, decision: 'reject', rank: 4, match_type: 'both' },
    { paper_id: 17867, openreview_id: 'a4b', title: 'NOLA: Compressing LoRA using Linear Combination of Random Bases', venue: 'ICLR 2024', year: 2024, decision: 'accept-poster', rank: 7, match_type: 'semantic' },
    { paper_id: 6820, openreview_id: 'nZeVKeeFYf9', title: 'LoRA: Low-Rank Adaptation of Large Language Models', venue: 'ICLR 2022', year: 2022, decision: 'accept-poster', rank: 15, match_type: 'both' },
    { paper_id: 15640, openreview_id: 'DLJznSp6X3', title: 'ReLoRA: High-Rank Training Through Low-Rank Updates', venue: 'ICLR 2024', year: 2024, decision: 'accept-poster', rank: 42, match_type: 'semantic' },
    { paper_id: 16151, openreview_id: 'RbKZBrPGRJ', title: 'LoRA-FA: Memory-efficient Low-rank Adaptation', venue: 'ICLR 2024', year: 2024, decision: 'reject', rank: 47, match_type: 'lexical' },
  ],
  evidence: [
    { label: 'E1', kind: 'review_point', text: '제안 기법은 실용적이지만 기존 어댑터 연구와 비교해 점진적입니다.', paper_id: 6820, paper_title: 'LoRA', review_point_id: 1, aspect: 'novelty', from_unsplit_review: true },
    { label: 'E2', kind: 'review_point', text: '7B~70B급 대형 모델로 확장했을 때도 같은 이득이 나오는지 확인되지 않았습니다.', paper_id: 15640, paper_title: 'ReLoRA', review_point_id: 2, aspect: 'experimental_scale', from_unsplit_review: false },
    { label: 'M1', kind: 'meta_review', text: 'AC: 메모리 절감 폭이 전체 GPU 메모리 대비 크지 않다는 지적에 저자가 충분히 답하지 못했다.', paper_id: 16151, paper_title: 'LoRA-FA', decision: 'reject' },
  ],
  citations: ['E1', 'E2', 'M1'],
  summary_markdown:
    '## LoRA 계열 논문에 대한 리뷰어 반응\n\n저랭크 어댑터로 파인튜닝 효율을 높이는 접근이 공통으로 지목되었습니다.\n\n리뷰어들이 가장 자주 지적한 부분은 **신규성**이었습니다. LoRA 원 논문조차 어댑터와 유사한 발상이라는 점에서 점진적이라는 평가를 받았고[E1], LoRA-FA는 메모리 절감 폭이 전체 GPU 메모리 대비 크지 않다는 비판을 받았습니다[M1].\n\n**실험 규모**도 반복적으로 문제시되었습니다. ReLoRA는 7B~70B급 대형 모델로의 확장 가능성이 불확실하다는 지적을 받았습니다[E2].\n\n결과적으로 LoRA 원 논문과 ReLoRA는 accept되었고, LoRA-FA는 reject되었습니다.',
  used_llm: true,
};
