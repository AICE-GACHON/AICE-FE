// 온보딩 단계 규칙. 주소로 아무 단계나 열 수 있게 되면서 같은 질문을 두 곳에서
// 하게 됐다 — "다음으로 갈 수 있나"(버튼)와 "이 단계를 열어도 되나"(주소). 둘은
// 같은 질문이므로 한 곳에서만 답한다. 따로 두면 버튼은 눌리는데 화면은 안 열리는
// 식으로 조용히 어긋난다.
export const TOTAL_STEPS = 4;

// 단계 N에 들어가려면 무엇이 답해져 있어야 하는가. 1단계는 조건이 없다.
const REQUIREMENT = {
  2: (answers) => Boolean(answers.userType),
  3: (answers) => answers.purposes.length > 0,
  4: (answers) => Boolean(answers.stage),
};

/** 지금 단계에서 '다음'을 누를 수 있는가 = 다음 단계의 입장 조건을 채웠는가. */
export function canProceed(step, answers) {
  const requirement = REQUIREMENT[step + 1];
  return requirement ? requirement(answers) : true;
}

// 답변으로 단계 접근을 막지는 않는다. '건너뛰기'가 항상 눌리는 정식 버튼이라
// (OnboardingLayout), 답 없이 어느 단계에든 닿는 건 원래부터 지원하는 흐름이다.
// 여기에 가드를 걸면 주소로 건너뛰는 것과 함께 건너뛰기 버튼까지 되돌려버린다.
// 주소에서 오는 값에 대해 확인할 것은 "읽을 수 있는 단계 번호인가"뿐이다.

/**
 * 주소창의 :step은 아무 문자열이나 될 수 있다 — 'abc', '99', '-1', '2.5', ''.
 * 읽을 수 없으면 null을 돌려주고, 호출부가 1단계로 되돌린다.
 */
export function parseStep(raw) {
  // Number('')는 0이고 Number(' 2 ')는 2다. 주소에서 온 값이라 문자열만 받는다.
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
  const step = Number(raw);
  return step >= 1 && step <= TOTAL_STEPS ? step : null;
}
