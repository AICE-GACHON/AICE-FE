// 온보딩 답변의 화면 표현(camelCase, 옵션 value)과 서버 표현(snake_case) 사이 변환.
//
// 두 방향을 한 파일에 두는 이유는 **서로의 역함수**여야 하기 때문이다. 저장 쪽만
// 고치고 되읽기 쪽을 안 고치면, 값이 사라지는 게 아니라 조용히 다른 값으로
// 되살아난다 — 화면에는 뭔가 떠 있으니 알아채기도 어렵다.
import { FIELD_OPTIONS, VENUE_OPTIONS } from './onboardingData';
import { emptyAnswers, saveAnswers } from './sessionState';
import { fetchMyOnboarding } from '../api/onboarding';

const isKnownOption = (options, value) => options.some((o) => o.value === value);

/**
 * 화면 답변 → POST /api/onboarding 본문 (OnboardingCreate와 같은 snake_case).
 *
 * similarityFocus·recencyBias는 아직 프론트에서만 받는 값이다 — 백엔드
 * 스키마(OnboardingCreate)에 대응하는 필드가 없어서 안 보낸다. purposes·
 * result_order는 서버 쪽이 여전히 기대하는 필드라 빈 값으로 채워 보낸다
 * (둘 다 default=[]라 비워 보내도 422가 나지 않는다).
 *
 * venue도 서버는 아직 문자열 하나만 받는다(OnboardingCreate.venue: str | None).
 * 화면은 여러 개 고를 수 있게 했지만, 서버에는 **첫 번째로 고른 것만** 보낸다 —
 * 나머지는 화면(sessionStorage)에는 남아있지만 계정에는 저장되지 않는다.
 */
export function toOnboardingPayload(answers) {
  const firstVenue = answers.venues[0] ?? null;
  return {
    user_type: answers.userType,
    purposes: [],
    // '직접 입력'은 옵션 값이 아니라 사용자가 친 문자열로 바꿔 보낸다.
    fields: answers.fields.map((f) => (f === 'custom' ? answers.fieldCustom : f)).filter(Boolean),
    stage: answers.stage,
    venue: firstVenue === 'custom' ? answers.venueCustom : firstVenue,
    result_order: [],
  };
}

/**
 * GET /api/user/me/onboarding 응답 → 화면 답변.
 *
 * 저장할 때 '직접 입력'이 자유 문자열로 바뀌었으므로, 되읽을 때는 **옵션 목록에
 * 없는 값 = 그때 직접 입력한 것**으로 보고 다시 갈라놓는다. 이 복원을 빼먹으면
 * fieldLabel()이 빈 문자열을 돌려줘서(onboardingData.js) 분야가 통째로 사라진다.
 */
export function answersFromProfile(profile) {
  const answers = emptyAnswers();
  if (!profile) return answers;

  answers.userType = profile.user_type ?? null;
  answers.stage = profile.stage ?? null;
  answers.onboardingId = profile.onboarding_id ?? null;

  const fields = [];
  for (const value of profile.fields ?? []) {
    if (isKnownOption(FIELD_OPTIONS, value)) {
      fields.push(value);
    } else {
      fields.push('custom');
      answers.fieldCustom = value;
    }
  }
  answers.fields = fields;

  // 서버는 venue를 하나만 들고 있다 — 여기서는 그 하나를 배열의 첫 항목으로 되읽는다.
  const venue = profile.venue ?? null;
  if (venue && !isKnownOption(VENUE_OPTIONS, venue)) {
    answers.venues = ['custom'];
    answers.venueCustom = venue;
  } else if (venue) {
    answers.venues = [venue];
  }

  return answers;
}

/**
 * 로그인 직후 서버에 저장된 답변으로 sessionStorage를 채운다.
 *
 * 온보딩 답변은 sessionStorage에만 있어서 탭을 닫으면 사라진다. 그대로 두면
 * 다시 로그인했을 때 업로드의 분야 기본값(UploadPage.defaultField)이 조용히
 * 비어버린다 — 사용자는 분명 답했는데 반영이 안 되는 것처럼 보인다.
 *
 * 서버에 답변이 없으면(404) 로컬 값을 **지우지 않는다.** 방금 익명으로 온보딩을
 * 마치고 기존 계정에 로그인한 경우가 있어서, 서버의 "없음"으로 덮으면 그 답변이
 * 사라진다.
 *
 * @returns {Promise<object|null>} 채워 넣은 답변, 없거나 실패면 null
 */
export async function syncAnswersFromServer() {
  try {
    const profile = await fetchMyOnboarding();
    if (!profile) return null;
    const answers = answersFromProfile(profile);
    saveAnswers(answers);
    return answers;
  } catch (err) {
    // 여기서 로그인을 막을 이유는 없다. 기본값이 비는 정도의 손해다.
    console.error('온보딩 답변 불러오기 실패, 로컬 값으로 계속 진행:', err);
    return null;
  }
}
