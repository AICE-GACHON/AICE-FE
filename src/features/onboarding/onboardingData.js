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

// 유사 논문을 고를 때 "비슷하다"의 기준 중 뭘 더 눈여겨볼지. 리랭크 프롬프트가
// 이 셋을 OR로 나열하고 있어서(paper_assistant/graph/nodes.py의 _RERANK_BASE),
// 하나를 고르면 **그 축의 일치를 더 무겁게 보라**는 문단이 프롬프트에 붙는다
// (rerank_system). 후보 50편은 그대로고 그 안에서 고르는 기준만 바뀐다 —
// 1단계 임베딩은 제목+초록이 벡터 하나라 세 축을 구분하지 못한다.
//
// ⚠️ value 문자열은 백엔드의 화이트리스트(schemas.SIMILARITY_FOCUS_VALUES)와
// **정확히** 같아야 한다. 어긋나면 422가 아니라 조용히 balanced로 접힌다.
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

// hybrid_search.py의 랭킹 가중치를 프리셋으로 갈아 끼운다(RANKING_PRESETS).
// 가중치 3개만이 아니라 **최신성 반감기까지** 한 벌로 바뀐다 — 인용도는 같은
// 연도 안의 백분위라, 연도가 퍼지지 않으면 "인용 많은 논문 우선"이 거의 아무
// 일도 하지 않기 때문이다.
//
//   balanced 유사도 0.35 · 최신성 0.45 · 인용도 0.20 · 반감기 3년 (기본)
//   recent        0.30 ·      0.50 ·      0.20 ·      2년
//   cited         0.30 ·      0.45 ·      0.25 ·      4년
//
// 어떤 프리셋도 "최신성 > 유사도"는 깨지 않는다 — 그건 사용자 선호보다 상위에
// 있는 요구사항이다(docs/랭킹_가중치_설계.md §1).
export const RECENCY_BIAS_OPTIONS = [
  { value: 'recent', label: '최신 트렌드 논문' },
  { value: 'cited', label: '검증된(인용 많은) 논문' },
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
  { value: 'custom', label: '직접 입력' },
];

export const FIELD_MAX_SELECT = 2;

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
export const venueLabel = (value) => VENUE_OPTIONS.find((o) => o.value === value)?.label ?? '';
