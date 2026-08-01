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

export const EXPERIENCE_OPTIONS = [
  { value: 'writing_first', label: '처음 작성 중' },
  { value: 'written_not_submitted', label: '논문은 작성해 봤지만 투고는 처음' },
  { value: 'submitted_1_2', label: '1~2회 투고 경험이 있음' },
  { value: 'submitted_3plus', label: '3회 이상 투고 경험이 있음' },
  { value: 'studying', label: '논문 작성이 아닌 논문 공부가 목적' },
];

export const PURPOSE_OPTIONS = [
  {
    value: 'reviewPrediction',
    label: '예상 리뷰 확인',
    desc: '내 논문이 어떤 리뷰를 받을 가능성이 있는지 미리 확인하고 싶어요.',
  },
  {
    value: 'similarSearch',
    label: '유사 논문 탐색',
    desc: '내 논문과 유사한 논문과 해당 논문이 받은 리뷰를 찾고 싶어요.',
  },
  {
    value: 'revisionDirection',
    label: '논문 수정 방향 확인',
    desc: '부족한 부분과 우선적으로 수정해야 할 내용을 알고 싶어요.',
  },
  {
    value: 'venueTrend',
    label: '학회·저널 경향 확인',
    desc: '유사 논문이 어느 학회에 제출되었고 어떤 결과를 받았는지 확인하고 싶어요.',
  },
  {
    value: 'reviewPatterns',
    label: '리뷰 패턴 학습',
    desc: '기존 논문들이 반복적으로 받은 리뷰 지적을 공부하고 싶어요.',
  },
];

export const PURPOSE_MAX_SELECT = 2;

export const FIELD_OPTIONS = [
  { value: 'nlp', label: 'LLM·자연어처리' },
  { value: 'agent', label: 'AI Agent·Multi-Agent' },
  { value: 'ml', label: '머신러닝' },
  { value: 'cv', label: '컴퓨터 비전' },
  { value: 'datamining', label: '데이터 마이닝' },
  { value: 'se', label: '소프트웨어 공학' },
  { value: 'hci', label: 'HCI' },
  { value: 'aisystems', label: 'AI 시스템' },
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

// 목적 선택에 따른 결과 카드 순서 (교수님 면담 정리 "선택 결과에 따른 화면 순서" 표 그대로).
const RESULT_ORDER_BY_PURPOSE = {
  reviewPrediction: ['예상 리뷰', '수정 우선순위', '반복되는 리뷰 지적', '유사 논문', '게재 경향'],
  similarSearch: ['유사 논문', '논문별 리뷰', '리뷰 이후 수정 내용', '반복되는 리뷰 지적', '게재 경향'],
  revisionDirection: ['종합 진단', '수정 우선순위', '예상 리뷰', '참고할 유사 논문', '학회 경향'],
  venueTrend: ['게재 경향', '유사 논문별 학회 정보', '학회별 승인·거절 분포', '자주 발생한 리뷰 지적', '논문 수정 제안'],
  reviewPatterns: ['반복되는 리뷰 지적', '유사 논문', '예상 리뷰', '게재 경향', '수정 우선순위'],
};

const DEFAULT_ORDER = RESULT_ORDER_BY_PURPOSE.reviewPrediction;

/**
 * 선택한 목적(최대 2개)에 맞춰 결과 카드 순서를 만든다.
 * "기능을 숨기지 말고 선택한 걸 위로 배치" 원칙 그대로,
 * 1순위 목적의 순서를 기준으로 두고 2순위 목적에만 있는 항목을 뒤에 이어붙인다.
 */
export function buildResultOrder(purposes) {
  if (!purposes || purposes.length === 0) return DEFAULT_ORDER;

  const [primary, secondary] = purposes;
  const primaryOrder = RESULT_ORDER_BY_PURPOSE[primary] ?? DEFAULT_ORDER;
  if (!secondary) return primaryOrder;

  const secondaryOrder = RESULT_ORDER_BY_PURPOSE[secondary] ?? [];
  const merged = [...primaryOrder];
  secondaryOrder.forEach((item) => {
    if (!merged.includes(item)) merged.push(item);
  });
  return merged;
}

// 경험 수준에 따라 설명 난이도를 어떻게 바꿀지 (프리뷰 화면에 안내 문구로 사용).
export const EXPERIENCE_TONE = {
  writing_first: '어려운 리뷰 용어에 설명을 덧붙이고, 핵심 문제를 쉬운 말로 풀어서 보여드려요.',
  written_not_submitted: '예상 리뷰와 수정 체크리스트, 투고 전 확인사항을 강조해서 보여드려요.',
  submitted_1_2: '요약보다 근거가 되는 논문과 리뷰 원문을 더 강조해서 보여드려요.',
  submitted_3plus: '요약보다 근거가 되는 논문과 리뷰 원문을 더 강조해서 보여드려요.',
  studying: '예상 리뷰보다 유사 논문과 기존 리뷰 사례를 먼저 보여드려요.',
};

export const userTypeLabel = (value) => USER_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? '';
export const purposeLabel = (value) => PURPOSE_OPTIONS.find((o) => o.value === value)?.label ?? '';
export const fieldLabel = (value) => FIELD_OPTIONS.find((o) => o.value === value)?.label ?? '';
export const stageLabel = (value) => STAGE_OPTIONS.find((o) => o.value === value)?.label ?? '';
export const venueLabel = (value) => VENUE_OPTIONS.find((o) => o.value === value)?.label ?? '';
