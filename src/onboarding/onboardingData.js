// 온보딩(회원가입 전) 3단계 질문 정의 + 답변에 따른 맞춤 로직.
// ChatGPT 면담 정리 원문의 매핑 표를 그대로 코드로 옮긴 것.

export const USER_TYPE_OPTIONS = [
  { value: 'undergrad', label: '학부생' },
  { value: 'grad', label: '대학원생' },
  { value: 'researcher', label: '연구자' },
  { value: 'reviewer', label: '교수·논문 심사자' },
  { value: 'industry', label: '기업 연구원' },
  { value: 'etc', label: '기타' },
];

// 유사 논문을 고를 때 "비슷하다"의 기준 중 뭘 더 눈여겨볼지. 지금 리랭크
// 프롬프트(paper_assistant/graph/nodes.py의 _RERANK_SYSTEM)는 이 셋을 OR로 느슨하게
// 보고 있어서, 유저가 하나에 가중치를 주면 실제로 다른 5편이 뽑힐 여지가 있다.
// 다만 백엔드 연결(프롬프트에 반영)은 아직 안 했다 — 지금은 프론트에서만 값을 받는다.
export const SIMILARITY_FOCUS_OPTIONS = [
  {
    value: 'problem',
    label: '연구 문제가 같은 논문',
    desc: '내가 다루는 주제 자체가 비슷한 논문을 더 보고 싶어요.',
  },
  {
    value: 'method',
    label: '방법론이 비슷한 논문',
    desc: '내가 쓴 방법을 어떻게 검증했는지 비슷한 논문을 더 보고 싶어요.',
  },
  {
    value: 'evaluation',
    label: '평가 방식·데이터셋이 비슷한 논문',
    desc: '비슷한 벤치마크·실험 세팅을 쓴 논문을 더 보고 싶어요.',
  },
  {
    value: 'balanced',
    label: '균형있게',
    desc: '세 가지를 골고루 보고 판단해 주세요.',
  },
];

// hybrid_search.py의 고정 가중치(유사도 0.35 · 최신성 0.45 · 인용도 0.20) 중
// 최신성·인용도 비중을 유저가 조절하는 것. 마찬가지로 백엔드 연결은 아직.
export const RECENCY_BIAS_OPTIONS = [
  { value: 'recent', label: '최신 트렌드 위주' },
  { value: 'cited', label: '검증된(인용 많은) 논문 위주' },
  { value: 'balanced', label: '균형있게' },
];

// 지금 코퍼스(ICLR·NeurIPS)는 AI·컴퓨터 분야뿐이지만, 다른 학회로 코퍼스를 넓힐
// 계획([[venue]]와 같은 이유)이 있어 전공 선택지는 처음부터 전체 학문 분야를
// 아우르게 잡는다. 다만 목록이 너무 길어지지 않도록 인접 전공은 묶는다.
export const FIELD_OPTIONS = [
  { value: 'ai_data', label: 'AI·데이터과학' },
  { value: 'cs_se', label: '컴퓨터공학·소프트웨어' },
  { value: 'eng', label: '전자·기계·화학 등 공학' },
  { value: 'natural_science', label: '수학·물리·화학 등 자연과학' },
  { value: 'life_medicine', label: '생명과학·의학·보건학' },
  { value: 'social_science', label: '경제·경영·사회과학' },
  { value: 'humanities', label: '인문학' },
  { value: 'arts_design', label: '예술·디자인' },
  { value: 'unsure', label: '아직 잘 모르겠음' },
  { value: 'custom', label: '직접 입력' },
];

export const FIELD_MAX_SELECT = 2;

export const STAGE_OPTIONS = [
  { value: 'idea', label: '아이디어를 정리하는 단계' },
  { value: 'abstract', label: '초록만 작성한 단계' },
  { value: 'draft', label: '논문 초안을 작성 중' },
  { value: 'pre_submit', label: '투고 직전' },
  { value: 'revising', label: '리뷰를 받고 수정 중' },
  { value: 'studying', label: '기존 논문을 공부하는 중' },
];

export const VENUE_OPTIONS = [
  { value: 'iclr', label: 'ICLR' },
  { value: 'neurips', label: 'NeurIPS' },
  { value: 'icml', label: 'ICML' },
  { value: 'acl', label: 'ACL' },
  { value: 'emnlp', label: 'EMNLP' },
  { value: 'cvpr', label: 'CVPR' },
  { value: 'aaai', label: 'AAAI' },
  { value: 'kdd', label: 'KDD' },
  { value: 'undecided', label: '아직 결정하지 않음' },
  { value: 'custom', label: '직접 입력' },
];

export const userTypeLabel = (value) => USER_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? '';
export const similarityFocusLabel = (value) => SIMILARITY_FOCUS_OPTIONS.find((o) => o.value === value)?.label ?? '';
export const recencyBiasLabel = (value) => RECENCY_BIAS_OPTIONS.find((o) => o.value === value)?.label ?? '';
export const fieldLabel = (value) => FIELD_OPTIONS.find((o) => o.value === value)?.label ?? '';
export const stageLabel = (value) => STAGE_OPTIONS.find((o) => o.value === value)?.label ?? '';
export const venueLabel = (value) => VENUE_OPTIONS.find((o) => o.value === value)?.label ?? '';
