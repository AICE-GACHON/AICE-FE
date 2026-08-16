// 온보딩 3단계 사이 이동 시 API를 매번 호출하지 않고 sessionStorage에만 임시 저장한다.
// 탭을 닫으면 사라지므로 오래된 온보딩 답변이 계속 남는 걸 막는다 (localStorage 대신 사용하는 이유).
const KEY = 'paper-trace:onboarding';

export const emptyAnswers = () => ({
  userType: null,
  similarityFocus: null,
  recencyBias: null,
  fields: [],
  fieldCustom: '',
  venues: [],
  venueCustom: '',
  onboardingId: null, // POST /api/onboarding 성공 시 채워짐 — 회원가입 요청에 실어 보내 계정에 연결한다
});

export function loadAnswers() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...emptyAnswers(), ...JSON.parse(raw) } : emptyAnswers();
  } catch {
    return emptyAnswers();
  }
}

export function saveAnswers(answers) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    // sessionStorage 사용 불가 환경(프라이빗 모드 등)에서는 조용히 무시 — 온보딩은 계속 진행 가능
  }
}

export function clearAnswers() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
