// 개발용 mock — 백엔드 없이도 결과 화면을 검증할 수 있게 하기 위한 데이터.
// VITE_API_BASE_URL이 없을 때만 쓰인다 (src/api/submissions.js).
//
// similar_papers/venue_trends/confidence/summary_markdown은 실제로
// http://127.0.0.1:8000/api/analyze (demo/server.py — paper_assistant.analyze()를 그대로 호출)에
// title="Graph Neural Networks for Molecular Property Prediction"으로 호출해서 받은 실측 응답이다.
// review_patterns만 그 호출에서 빈 배열이라 스키마(paper_assistant/schemas.py ReviewPattern)에 맞춰
// 임의로 채워 넣었다 — 실제 백엔드가 붙으면 이 파일은 쓰이지 않는다.
export const MOCK_REPORT = {
  query_title: 'Graph Neural Networks for Molecular Property Prediction',
  query_abstract:
    'We propose a graph neural network approach for predicting molecular properties using message passing and attention mechanisms. Our method achieves state-of-the-art results on several benchmark datasets by combining rule-based feature engineering with learned representations.',
  confidence: {
    level: 'strong',
    message: '이 주제의 논문이 코퍼스에 충분히 있습니다.',
    is_reliable: true,
    evidence: 0.9536,
  },
  similar_papers: [
    { paper_id: 32316, openreview_id: 'gwGYN1fQY8H', title: 'Motif-based Graph Self-Supervised Learning for Molecular Property Prediction', venue: 'NeurIPS 2021', year: 2021, decision: 'accept-poster', rank: 1, match_type: 'both', tags: [], avg_rating: null, rating_count: 0, rating_spread: null, rating_vs_venue: null, rating_vs_threshold: null },
    { paper_id: 29573, openreview_id: '3nwlXtQESj', title: 'Path Complex Message Passing for Molecular Property Prediction', venue: 'ICLR 2025', year: 2025, decision: 'reject', rank: 2, match_type: 'both', tags: [], avg_rating: null, rating_count: 0, rating_spread: null, rating_vs_venue: null, rating_vs_threshold: null },
    { paper_id: 8213, openreview_id: 'WFewvIEb0aT', title: 'Substructure-Atom Cross Attention for Molecular Representation Learning', venue: 'ICLR 2023', year: 2023, decision: 'reject', rank: 3, match_type: 'semantic', tags: [], avg_rating: null, rating_count: 0, rating_spread: null, rating_vs_venue: null, rating_vs_threshold: null },
    { paper_id: 4978, openreview_id: 'yvzMA5im3h', title: 'Graph Joint Attention Networks', venue: 'ICLR 2021', year: 2021, decision: 'reject', rank: 4, match_type: 'lexical', tags: [], avg_rating: null, rating_count: 0, rating_spread: null, rating_vs_venue: null, rating_vs_threshold: null },
    { paper_id: 17800, openreview_id: 'Mtlt3RQTXJ', title: 'Bi-level Contrastive Learning for Knowledge Enhanced Molecule Representations', venue: 'ICLR 2024', year: 2024, decision: 'reject', rank: 5, match_type: 'semantic', tags: [], avg_rating: null, rating_count: 0, rating_spread: null, rating_vs_venue: null, rating_vs_threshold: null },
    { paper_id: 14584, openreview_id: 'F7QnIKlC1N', title: "GTMGC: Using Graph Transformer to Predict Molecule's Ground-State Conformation", venue: 'ICLR 2024', year: 2024, decision: 'accept-spotlight', rank: 6, match_type: 'lexical', tags: [], avg_rating: null, rating_count: 0, rating_spread: null, rating_vs_venue: null, rating_vs_threshold: null },
    { paper_id: 16687, openreview_id: 'uqPnesiGGi', title: 'Motif-aware Attribute Masking for Molecular Graph Pre-training', venue: 'ICLR 2024', year: 2024, decision: 'reject', rank: 7, match_type: 'semantic', tags: [], avg_rating: null, rating_count: 0, rating_spread: null, rating_vs_venue: null, rating_vs_threshold: null },
  ],
  review_patterns: [
    {
      label: 'Baselines', aspect: 'baselines', paper_count: 16, total_papers: 20,
      examples: ['비교 대상 베이스라인이 최신 기법을 포함하지 않습니다.'],
      base_rate: 0.788, lift: 1.02, p_value: 0.44, is_distinctive: false,
      accept_with: 5, accept_without: 2, decided_with: 14, decided_without: 6,
      accept_rate_with: 0.357, accept_rate_without: 0.333,
      contrast_p_value: 0.51, is_contrast_significant: false,
    },
    {
      label: '재현성', aspect: 'reproducibility', paper_count: 9, total_papers: 20,
      examples: ['하이퍼파라미터와 학습 설정이 충분히 기술되지 않아 재현이 어렵습니다.'],
      base_rate: 0.21, lift: 2.14, p_value: 0.012, is_distinctive: true,
      accept_with: 2, accept_without: 6, decided_with: 9, decided_without: 11,
      accept_rate_with: 0.222, accept_rate_without: 0.545,
      contrast_p_value: 0.031, is_contrast_significant: true,
    },
    {
      label: '실험 규모', aspect: 'experimental_scale', paper_count: 7, total_papers: 20,
      examples: ['데이터셋 1~2개로는 일반화 가능성을 주장하기 부족합니다.'],
      base_rate: 0.19, lift: 1.85, p_value: 0.08, is_distinctive: false,
      accept_with: 1, accept_without: 7, decided_with: 7, decided_without: 13,
      accept_rate_with: 0.143, accept_rate_without: 0.538,
      contrast_p_value: 0.09, is_contrast_significant: false,
    },
  ],
  venue_trends: [
    { venue: 'ICLR', year: null, paper_count: 17, accept_count: 3, accept_rate: 0.176, corpus_accept_rate: 0.31, accept_lift: 0.57, is_coverage_biased: false },
    { venue: 'NeurIPS', year: null, paper_count: 3, accept_count: 3, accept_rate: 1.0, corpus_accept_rate: 0.95, accept_lift: 1.05, is_coverage_biased: true },
  ],
  rating_context: {
    neighbor_mean: null, accepted_mean: null, rejected_mean: null, rated_papers: 0,
    threshold: null, threshold_venue: null, split_papers: [], biased_venues: ['NeurIPS'],
  },
  resubmission_flows: [{ from_venue: 'ICLR 2024', to_venue: 'NeurIPS 2024', count: 2 }],
  summary_markdown:
    '## 유사 논문 20편\n- 재현성 지적이 코퍼스 평균 대비 2.14배 높고, 이 지적을 받은 논문의 통과율(22%)이 그렇지 않은 논문(55%)보다 뚜렷이 낮습니다.\n- 실험 규모 지적도 평균보다 잦지만 표본이 작아 당락과의 연관은 판단을 보류합니다.\n- 게재 경향: ICLR 3/17 (18%), NeurIPS 3/3 — NeurIPS는 표본이 채택 논문 위주로 편향되어 절대 채택률로 해석할 수 없습니다.',
};
