// 결과 화면(목록 → 상세) 골격을 백엔드 없이 검증하기 위한 임시 더미 데이터.
//
// ⚠️ 실제 결과를 대신 채우는 용도가 아니다. ResultReport는 selected_papers가 비었을 때
// "찾지 못했어요"를 그대로 보여주고, 사용자가 미리보기 버튼을 명시적으로 눌렀을 때만
// 이 데이터를 쓴다 — 그때도 경고 배너가 계속 떠 있는다. 백엔드가 selected_papers를
// 내려주기 시작하면 이 파일은 지우면 된다.
//
// 내용은 실제 화면 캡처(ICLR 2025 임베딩·검색 계열)를 그대로 옮긴 것이다.

const ts = (s) => Date.parse(s.replace(' ', 'T') + ':00+09:00');

/** 상세 화면의 "수정 전 → 수정 후" 두 칸을 만드는 재료. 서버의 FieldChange와 같은 모양. */
const lengthCollapseChanges = [
  {
    field: 'abstract', label: '초록', kind: 'text', similarity: 0.81,
    segments: [
      { op: 'equal', text: 'Text embedding models often ' },
      { op: 'delete', text: 'fail on long inputs' },
      { op: 'insert', text: 'collapse toward the origin as input length grows' },
      { op: 'equal', text: '. We show this ' },
      { op: 'delete', text: 'is caused by the attention mechanism' },
      { op: 'insert', text: 'stems from a low-pass filtering effect in self-attention, which we verify on MTEB across 36 of 56 datasets' },
      { op: 'equal', text: ', and propose ' },
      { op: 'insert', text: 'TempScale, ' },
      { op: 'equal', text: 'a temperature-scaling remedy' },
      { op: 'insert', text: ' that requires no retraining' },
      { op: 'equal', text: '.' },
    ],
  },
  {
    field: 'title', label: '제목', kind: 'text', similarity: 0.93,
    segments: [
      { op: 'equal', text: 'Length-Induced Embedding Collapse in ' },
      { op: 'delete', text: 'Text Encoders' },
      { op: 'insert', text: 'Transformer-based Models' },
    ],
  },
];

const lengthCollapseTimeline = [
  { event_id: 't1', at: ts('2024-11-02 21:28'), date: '2024-11-02 21:28', kind: 'review',
    kind_label: '리뷰', actor: '리뷰어 dyPh', headline: '리뷰어 dyPh — 5',
    review: { rating: 5, rating_raw: '5', is_unsplit: false,
      summary: '긴 텍스트에서 임베딩이 뭉치는 현상을 관찰하고 온도 조절로 완화하려는 시도.',
      strengths: '현상 자체는 흥미롭고 재현 가능한 형태로 제시했습니다.',
      weaknesses: 'MTEB 56개 데이터셋 중 36개만 평가했고 대형 데이터셋(MSMARCO 등)이 제외된 이유가 불충분합니다.',
      questions: '수백~수천만 토큰을 다루는 대형 모델에도 같은 현상이 나타나나요?' } },
  { event_id: 't2', at: ts('2024-11-04 17:01'), date: '2024-11-04 17:01', kind: 'review',
    kind_label: '리뷰', actor: '리뷰어 LdEb', headline: '리뷰어 LdEb — 5',
    review: { rating: 5, rating_raw: '5', is_unsplit: false,
      summary: '저역통과 필터링으로 원인을 설명하지만 근거가 약합니다.',
      weaknesses: 'TempScale의 온도 스케일링 공식이 YaRN(ICLR 2024) 및 Overcoming a Theoretical Limitation of Self-Attention(ACL 2022)의 방법과 유사한데 이론적·실험적 비교가 없습니다.' } },
  { event_id: 't3', at: ts('2024-11-04 18:35'), date: '2024-11-04 18:35', kind: 'review',
    kind_label: '리뷰', actor: '리뷰어 pceo', headline: '리뷰어 pceo — 6',
    review: { rating: 6, rating_raw: '6', is_unsplit: false,
      summary: '실용적 가치는 있으나 비교군이 부족합니다.',
      weaknesses: 'Flow Function, Whitening 등 기존 임베딩 후처리 기법과의 성능 비교가 없어 TempScale의 상대적 우위를 알 수 없습니다.' } },
  { event_id: 't4', at: ts('2024-11-11 16:37'), date: '2024-11-11 16:37', kind: 'review',
    kind_label: '리뷰', actor: '리뷰어 NUva', headline: '리뷰어 NUva — 8',
    review: { rating: 8, rating_raw: '8', is_unsplit: false,
      summary: '분석이 명료하고 제안 방법이 간단해 적용하기 쉽습니다.',
      weaknesses: 'Figure 5에서 100~500 길이 구간의 σ_a 값이 비슷한데 Figure 1a에서는 이 구간에서 성능이 크게 떨어지며, 제안한 분석과 실제 성능 저하 간의 연관성이 약합니다.' } },
  { event_id: 't5', at: ts('2024-11-13 01:26'), date: '2024-11-13 01:26', kind: 'review_update',
    kind_label: '리뷰 수정', actor: '리뷰어 pceo', rating: 6,
    headline: '리뷰어 pceo가 저자 응답 이후 리뷰를 수정했습니다 (최종 6) — 수정 전 내용은 공개되지 않습니다' },
  { event_id: 't6', at: ts('2024-11-22 19:45'), date: '2024-11-22 19:45', kind: 'rebuttal',
    kind_label: '저자 응답', actor: '저자', headline: '저자: Response to Reviewer dyPh — Part 1/2',
    text: '데이터셋 선택은 계산 자원과 시간 제약 때문이며, 가능한 한 다양한 태스크를 대표하도록 무작위로 선택했다고 답변합니다. 대형 데이터셋은 최종본에 추가하겠습니다.' },
  { event_id: 't7', at: ts('2024-11-22 20:00'), date: '2024-11-22 20:00', kind: 'rebuttal',
    kind_label: '저자 응답', actor: '저자', headline: '저자: Response to Reviewer LdEb — Part 1/2',
    text: 'YaRN 및 ACL 2022 방법과 TempScale의 이론적 동기 차이를 서술하며, 두 기존 방법은 위치 인코딩을 다루는 반면 우리는 임베딩 분포 자체를 다룬다고 반박합니다.' },
  { event_id: 't8', at: ts('2024-11-22 20:33'), date: '2024-11-22 20:33', kind: 'author_revision',
    kind_label: '저자 수정', actor: '저자', headline: '관측 가능한 최초 제출본 — 이전 내용은 확인할 수 없습니다',
    is_baseline: true, changes: [] },
  { event_id: 't9', at: ts('2024-11-24 11:05'), date: '2024-11-24 11:05', kind: 'author_revision',
    kind_label: '저자 수정', actor: '저자', headline: '제목과 초록을 수정했습니다',
    is_baseline: false, changes: lengthCollapseChanges },
  { event_id: 't10', at: ts('2025-01-18 05:01'), date: '2025-01-18 05:01', kind: 'meta_review',
    kind_label: 'AC 총평', actor: 'AC', headline: 'AC 총평',
    text: '리뷰어들은 현상 관찰의 신선함은 인정했으나, 원인 분석의 타당성과 기존 방법론과의 비교 부족을 공통으로 지적했습니다. 저자 응답이 이 두 지점을 충분히 해소하지 못했다는 데 합의가 있었습니다.' },
  { event_id: 't11', at: ts('2025-01-22 14:30'), date: '2025-01-22 14:30', kind: 'decision',
    kind_label: '최종 결과', actor: 'PC', headline: '최종 결과: Reject', text: 'Reject' },
];

const lengthCollapseNarrative = {
  headline: '긴 텍스트에서 임베딩이 원점 근처로 뭉치는 저역통과 필터링 현상을 분석하고 온도 조절(TempScale) 완화법을 제안했으나, 원인 분석의 타당성과 유사 방법론과의 비교 부족을 지적받아 결국 게재 거절되었습니다.',
  reviewers_asked: [
    'MTEB 56개 데이터셋 중 36개만 평가했고 대형 데이터셋(MSMARCO 등)이 제외된 이유가 불충분함',
    '수백 토큰 수준의 긴 텍스트로 저역통과 필터링을 논하면서, 수만~수십만 토큰을 다루는 대형 모델의 존재와 어떻게 양립하는지 불분명함',
    'TempScale의 온도 스케일링 공식이 YaRN(ICLR 2024) 및 Overcoming a Theoretical Limitation of Self-Attention(ACL 2022)의 방법과 유사한데 이론적·실험적 비교가 없음',
    'Flow Function, Whitening 등 기존 임베딩 후처리 기법과의 성능 비교가 없어 TempScale의 상대적 우위를 알 수 없음',
    'Figure 5에서 100~500 길이 구간의 σ_a 값이 비슷한데 Figure 1a에서는 이 구간에서 성능이 크게 떨어져, 제안한 분석과 실제 성능 저하 간의 연관성이 약함',
  ],
  authors_changed: [
    '데이터셋 선택은 계산 자원과 시간 제약 때문이라고 설명하며, 가능한 한 다양한 태스크를 대표하도록 무작위로 선택했다고 답변함',
    '저역통과 필터링 효과는 텍스트 길이와 임베딩 분포의 내재적 경향을 보여주는 것이며, 모델의 실제 긴 문맥 처리 능력과는 별개의 현상이라고 답변함',
    '자신들의 임베딩 모델은 양방향 어텐션 구조를 사용하므로 단방향 어텐션 기반의 대형 LLM과는 구조적 차이가 있어 직접 비교가 어렵다고 설명함',
    'YaRN과 ACL 2022 방법과 TempScale의 이론적 동기 차이를 서술하며, 두 기존 방법과의 비교 실험을 최종본에 추가하겠다고 약속함',
  ],
  outcome_note: '이 논문은 ICLR 2025에서 최종적으로 게재 거부되었습니다. 저자 답변 이후 한 심사위원이 리뷰를 수정한 기록이 있으나 점수 변화 여부는 공개되어 있지 않으며, 별도의 재제출 이력은 없습니다.',
  evidence_scope: 'abstract_only',
  used_llm: true,
};

/** 목록 화면에 뜨는 5편. 서버의 selected_papers[]와 같은 모양이다. */
export const MOCK_SELECTED_PAPERS = [
  {
    paper_id: 901, rank: 1, decision: 'reject', venue: 'ICLR 2025', confidence: 'high',
    title: 'GASLITEing the Retrieval: Poisoning Knowledge DBs to Mislead Embedding-based Search',
    avg_rating: 6, rating_count: 4, rating_spread: 3,
    openreview_url: 'https://openreview.net/forum?id=GASLITEing',
    reason: '둘 다 Adversarial Decoding(Zhang et al., 2025)에 기반한 임베딩 공간 최적화 기법을 사용해 검색 시스템을 대상으로 한 공격을 다룬다.',
    meta_review: 'This paper presents a framework for attacking retrieval systems. The experimental results are impressive and the paper is well-written. However, the technical novelty of the proposed method is limited, and the assumptions made about query distributions and embedding models are unrealistic for real-world scenarios.',
    reviews: [
      { rating: 8, rating_raw: '8', is_unsplit: false,
        summary: 'GASLITE는 임베딩 기반 검색기를 겨냥해 지식 DB에 적대적 문서를 심는 공격을 제안한다.',
        weaknesses: '1. Computational Intensity: The GASLITE attack method is computationally intensive, especially for LLM-based embedding retriever, requiring significant resources, which may limit its scalability and practical application in certain scenarios. This computational demand could be a barrier for less resource-intensive environments or smaller-scale attacks.\n2. Dependence on External Data: The effectiveness of the attack relies on the ability to generate or obtain a sample of queries related to the targeted concept. If the attacker cannot generate or obtain a representative sample, the attack\'s effectiveness may be diminished.\n3. Impact of Tokenization: The paper acknowledges that the tokenization process can affect the attack\'s success, as certain token lists cannot be reached from any text. This implies that the attack\'s effectiveness is tied to the specific tokenizer used by the embedding model.',
        strengths: '1. No need to update model parameters/additional training.\n2. No need for read permission of KDB.\nThe method is better than the baseline method in both Knows All and Knows What scenarios. At the same time, |Padv| << |P|, and the position rate is less than or equal to 0.0001%. A small number of samples achieve the maximum SEO attack effect.\nIt also analyzes various factors that affect the GASLITE attack method in this paper: similarity measurement methods, vector space characteristics of the Embedding model, diversity distribution of target Queries.',
        questions: '1. Why didn\'t embedding-based retrievers use models such as bge-en-icl 7kM, stella_en_1.5B_v5(1kM), gte-Qwen2-7B-instruct(7kM), and GritLM-7B(7kM)?\n2. How about the effect of these Embedding models with parameters of around 7000M?\n3. Do you think there is a better form from info prefix + trigger for Padv?\n4. How is the metric informativeness measured?\n5. What if the embedding-based retriever is a black box model and we cannot obtain its weights parameters, how can we conduct this SEO attack?' },
      { rating: 6, rating_raw: '6', is_unsplit: false,
        summary: '공격 성능은 인상적이나 위협 모델의 현실성이 의문이다.',
        weaknesses: '공격자가 대상 개념에 대한 쿼리 분포를 안다고 가정하는 것이 실제 상황에서 얼마나 성립하는지 불분명합니다.',
        strengths: '평가가 광범위하고 여러 임베딩 모델에 걸쳐 재현됩니다.' },
      { rating: 5, rating_raw: '5', is_unsplit: false,
        summary: '기존 적대적 검색 공격과의 차별점이 크지 않다.',
        weaknesses: '기술적 신규성이 제한적이며, 관련 연구와의 비교가 부족합니다.' },
      { rating: 5, rating_raw: '5', is_unsplit: false,
        summary: '방어 기법에 대한 논의가 없다.',
        weaknesses: '공격만 제시하고 완화 방안을 다루지 않아 실무적 함의가 약합니다.' },
    ],
  },
  {
    paper_id: 902, rank: 2, decision: 'reject', venue: 'ICLR 2025', confidence: 'medium',
    title: 'Asymmetric Embedding Models for Hierarchical Retrieval: Provable Constructions and a Pretrain-Finetune Recipe',
    avg_rating: 3.5, rating_count: 4, rating_spread: 3,
    reason: '둘 다 텍스트 임베딩 모델(GTR, Contriever 등)의 검색 성능과 정보 손실 문제를 다룬다.',
    meta_review: 'This paper considers the problem of hierarchical retrieval. There was consensus amongst reviewers that the technical motivation here is not adequately articulated, and the experimental setup was also seen as quite weak.',
  },
  {
    paper_id: 903, rank: 3, decision: 'reject', venue: 'ICLR 2025', confidence: 'high',
    title: 'Length-Induced Embedding Collapse in Transformer-based Models',
    avg_rating: 6, rating_count: 4, rating_spread: 3,
    openreview_url: 'https://openreview.net/forum?id=LengthCollapse',
    // 타임라인의 review 이벤트와 같은 리뷰다 — 목록으로도, 시간순으로도 볼 수 있게 한다.
    reviews: lengthCollapseTimeline
      .filter((e) => e.kind === 'review')
      .map((e) => e.review),
    reason: '둘 다 텍스트 길이가 임베딩 품질에 미치는 영향과 그로 인한 정보 손실을 분석한다.',
    meta_review: '리뷰어들은 현상 관찰의 신선함은 인정했으나, 원인 분석의 타당성과 기존 방법론과의 비교 부족을 공통으로 지적했습니다.',
  },
  {
    paper_id: 904, rank: 4, decision: 'reject', venue: 'ICLR 2025', confidence: 'medium',
    title: 'On the Vulnerability of Applying Retrieval-Augmented Generation within Knowledge-Intensive Application Domains',
    avg_rating: 5, rating_count: 3, rating_spread: 2,
    reason: '둘 다 검색 시스템의 취약점과 정보 유출을 다루지만, 이쪽은 검색 시스템에만 집중해 있다.',
    meta_review: '제목이 RAG 전반을 다룬다고 주장하면서 실제로는 특정 도메인에만 집중해 있어 오해를 유발한다는 지적과, 관련 적대적 공격·방어 문헌과의 비교가 부족하다는 지적을 받았습니다.',
  },
  {
    paper_id: 905, rank: 5, decision: 'reject', venue: 'ICLR 2025', confidence: 'low',
    title: 'TrojanRAG: Retrieval-Augmented Generation Can Be Backdoor Driver in Large Language Models',
    avg_rating: 5, rating_count: 4, rating_spread: 1,
    reason: '검색 인덱스를 오염시켜 생성 결과를 조작한다는 점에서 위협 모델이 겹친다.',
    meta_review: '공격 시나리오는 현실적이나 방어 기법에 대한 논의가 부족하다는 평가를 받았습니다.',
  },
];

/** paper_id → 상세 화면 데이터. 서버의 GET /api/papers/{id}/story 응답과 같은 모양. */
export const MOCK_STORY_BY_PAPER = {
  903: {
    paper_id: 903, title: 'Length-Induced Embedding Collapse in Transformer-based Models',
    venue: 'ICLR 2025', year: 2025, decision: 'reject',
    timeline: lengthCollapseTimeline, timeline_supported: true,
    narrative: lengthCollapseNarrative,
    caveats: [
      '리뷰 본문과 점수는 최종 수정본입니다. 리뷰어가 저자 응답 이후 리뷰를 고친 경우 최초 게시 시점의 내용과 다르며, 고치기 전 점수는 공개되지 않습니다.',
      '확인할 수 있는 수정은 제목·초록·첨부파일까지입니다. 논문 본문이 어떻게 바뀌었는지는 PDF 안에 있어 알 수 없습니다.',
    ],
    cached_at: null,
  },
};

/** 상세 데이터가 없는 논문은 목록의 요약만으로 최소한의 화면을 만든다. */
export function mockStoryFor(paper) {
  return MOCK_STORY_BY_PAPER[paper.paper_id] ?? {
    paper_id: paper.paper_id, title: paper.title, venue: paper.venue,
    decision: paper.decision, timeline: [], timeline_supported: true,
    narrative: {
      headline: paper.meta_review, reviewers_asked: [], authors_changed: [],
      outcome_note: null, evidence_scope: 'replies_only', used_llm: false,
    },
    caveats: ['이 논문은 더미 데이터에 상세 이력이 없습니다 (골격 확인용).'],
    cached_at: null,
  };
}
