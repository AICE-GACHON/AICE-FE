// 서버가 준 진행 이벤트 목록을 화면에 그릴 단계 목록으로 접는다.
//
// 서버는 같은 step을 두 번 보낸다 — 시작(done=false)과 끝(done=true). 그대로
// 그리면 같은 줄이 두 번 나오므로 step 기준으로 접어야 한다. 이 규칙은 서버가
// 정한 것이다 (AnalysisResponse.progress 설명).
//
// **순수 함수로 떼어 둔 이유**는 폴링 응답이 매번 "지금까지의 전체 목록"이라,
// 접는 방식이 틀리면 화면이 조용히 이상해지는데 그걸 컴포넌트 안에서는 확인하기
// 어렵기 때문이다.

/**
 * @param {Array<{step: string, done: boolean, label: string, detail?: string|null, at: string}>} progress
 * @returns {Array<{step, done, label, detail, at}>} 처음 등장한 순서대로, step당 한 줄
 */
export function toSteps(progress) {
  if (!Array.isArray(progress)) return [];

  // Map은 삽입 순서를 지키고, 같은 키에 다시 set해도 그 자리를 유지한다 —
  // 끝 이벤트가 시작 이벤트를 제자리에서 덮어쓴다는 뜻이다.
  const byStep = new Map();
  for (const event of progress) {
    if (!event?.step) continue;
    // **나중 것이 통째로 이긴다** (detail 포함). 앞 이벤트의 detail을 물려주지
    // 않는 이유는, 그 문구가 대개 "지금 왜 오래 걸리는지"라 끝난 뒤에는 틀린
    // 말이 되기 때문이다 (예: 준비 단계의 "모델을 불러오느라...").
    byStep.set(event.step, event);
  }
  return [...byStep.values()];
}

/**
 * 지금 돌고 있는 단계. 끝 이벤트만 와 있는 순간(단계 사이)에는 null이다 —
 * 그때 억지로 무언가를 "진행 중"으로 표시하면 없는 사실을 지어내는 것이 된다.
 */
export function currentStep(steps) {
  const last = steps[steps.length - 1];
  return last && !last.done ? last : null;
}
