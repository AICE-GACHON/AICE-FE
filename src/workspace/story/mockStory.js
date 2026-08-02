// 개발용 mock — 백엔드 없이 심사 서사 패널을 검증하기 위한 데이터.
// VITE_API_BASE_URL이 없을 때만 쓰인다 (src/api/papers.js).
// docs/FRONTEND_심사서사_API.md의 paper_id 27030 실제 예시를 기반으로 구성했다.
const ts = (s) => Date.parse(s.replace(' ', 'T') + ':00+09:00');

export const MOCK_STORY = {
  paper_id: 27030,
  openreview_id: 'EzjsoomYEb',
  title: 'Understanding the Expressive Power of Topological Deep Learning Models',
  venue: 'ICLR 2025',
  year: 2025,
  decision: 'accept-oral',

  journey: {
    stops: [
      {
        paper_id: 27030, openreview_id: 'EzjsoomYEb', title: 'Understanding the Expressive Power of Topological Deep Learning Models',
        venue: 'ICLR 2025', year: 2025, decision: 'accept-oral',
        avg_rating: 8.0, rating_count: 3, rating_vs_venue: 2.85,
        is_query: true, match_method: null, match_confidence: null,
      },
    ],
    outcome: 'single',
    message: null,
  },

  timeline: [
    {
      event_id: 'e1', at: ts('2024-11-03 06:29'), date: '2024-11-03 06:29',
      kind: 'review', kind_label: '리뷰', actor: '리뷰어 8Wou', headline: '리뷰어 8Wou — 8',
      review: {
        rating: 8.0, rating_raw: '8', confidence: 3.0,
        summary: 'The paper presents an in-depth exploration of the expressive power of topological deep learning models, comparing them against standard GNNs on several theoretical and empirical benchmarks.',
        strengths: '잘 정리된 이론적 분석과 다양한 벤치마크에서의 실험 결과가 설득력 있습니다.',
        weaknesses: 'Figure 5의 텐서 다이어그램에서 인덱스 표기가 불명확해서 재현하기 어렵습니다. 또한 베이스라인 대비 런타임 비교가 없습니다.',
        questions: '제안 방법이 대규모 그래프에서도 확장 가능한가요?',
        is_unsplit: false,
      },
    },
    {
      event_id: 'e2', at: ts('2024-11-18 02:17'), date: '2024-11-18 02:17',
      kind: 'rebuttal', kind_label: '저자 응답', actor: '저자', headline: '저자: General Response',
      text: 'We thank all the reviewers for their positive evaluations and constructive feedback. We have added a runtime comparison table against standard GNN baselines on ZINC and MOLHIV, and clarified the tensor diagram notation in Figure 5.',
    },
    {
      event_id: 'e3', at: ts('2024-11-18 08:57'), date: '2024-11-18 08:57',
      kind: 'comment', kind_label: '코멘트', actor: '리뷰어 8Wou', headline: '리뷰어 8Wou의 코멘트',
      text: 'I thank the authors for their rebuttal. The added runtime comparison addresses my main concern, and the notation is now much clearer. I will raise my score accordingly.',
    },
    {
      event_id: 'e4', at: ts('2024-11-13 01:16'), date: '2024-11-13 01:16',
      kind: 'review_update', kind_label: '리뷰 수정', actor: '리뷰어 sF9V',
      headline: '리뷰어 sF9V가 저자 응답 이후 리뷰를 수정했습니다 (최종 8) — 수정 전 내용은 공개되지 않습니다',
      rating: 8.0,
    },
    {
      event_id: 'e5', at: ts('2024-11-18 02:20'), date: '2024-11-18 02:20',
      kind: 'author_revision', kind_label: '저자 수정', actor: '저자', headline: '초록을 수정했습니다',
      is_baseline: false,
      changes: [
        {
          field: 'abstract', label: '초록', kind: 'text', similarity: 0.86,
          before: 'We propose a novel method for analyzing topological deep learning models.',
          after: 'We propose an efficient method for analyzing topological deep learning models, with added runtime comparisons against standard GNN baselines.',
          segments: [
            { op: 'equal', text: 'We propose ' },
            { op: 'delete', text: 'a novel' },
            { op: 'insert', text: 'an efficient' },
            { op: 'equal', text: ' method for analyzing topological deep learning models' },
            { op: 'insert', text: ', with added runtime comparisons against standard GNN baselines' },
            { op: 'equal', text: '.' },
          ],
        },
      ],
    },
    {
      event_id: 'e6', at: ts('2024-11-01 00:00'), date: '2024-11-01 00:00',
      kind: 'author_revision', kind_label: '저자 수정', actor: '저자', headline: '최초 제출본 (관측 가능한 첫 버전)',
      is_baseline: true, changes: [],
    },
    {
      event_id: 'e7', at: ts('2025-01-15 09:00'), date: '2025-01-15 09:00',
      kind: 'meta_review', kind_label: 'AC 총평', actor: 'AC', headline: 'AC 총평',
      text: 'The reviewers unanimously agree this is a strong contribution with clear theoretical grounding and thorough empirical validation. The rebuttal addressed the main concerns around notation clarity and runtime efficiency.',
    },
    {
      event_id: 'e8', at: ts('2025-01-22 14:27'), date: '2025-01-22 14:27',
      kind: 'decision', kind_label: '최종 결과', actor: 'PC', headline: '최종 결과: Accept (Oral)',
      text: 'Accept (Oral)',
    },
  ],
  timeline_supported: true,

  narrative: {
    headline: '위상학적 딥러닝 모델의 표현력을 다룬 이 논문은 설명 난해함과 실험적 검증 부족을 지적받았고, 저자들은 런타임 비교 결과를 제시하고 추가 설명 및 실험 확장을 약속했습니다.',
    reviewers_asked: [
      'Figure 5의 텐서 다이어그램에서 인덱스 표기가 불명확함',
      '베이스라인 대비 런타임 비교가 없음',
    ],
    authors_changed: [
      'ZINC·MOLHIV 벤치마크 런타임 비교표를 답변에 제시함',
      '표기법을 명확히 하는 문단을 초록에 추가함',
    ],
    outcome_note: '리뷰어 3명 모두 응답 이후 점수를 유지하거나 올렸고, 최종적으로 accept-oral로 결정됐습니다.',
    evidence_scope: 'abstract_only',
    used_llm: true,
  },

  caveats: [
    '논문 본문 PDF의 실제 수정 내용은 확인할 수 없습니다 — 제목·초록·첨부파일 변경만 알 수 있습니다.',
    '리뷰 수정 전 점수는 OpenReview가 공개하지 않아 복원할 수 없습니다.',
  ],
  cached_at: null,
};
