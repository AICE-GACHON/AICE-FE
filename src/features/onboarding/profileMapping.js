// 온보딩 답변의 화면 표현(camelCase, 옵션 value)과 서버 표현(snake_case) 사이 변환.
//
// 두 방향을 한 파일에 두는 이유는 **서로의 역함수**여야 하기 때문이다. 저장 쪽만
// 고치고 되읽기 쪽을 안 고치면, 값이 사라지는 게 아니라 조용히 다른 값으로
// 되살아난다 — 화면에는 뭔가 떠 있으니 알아채기도 어렵다.
import { FIELD_OPTIONS, VENUE_OPTIONS, buildResultOrder } from './onboardingData';
import { emptyAnswers, saveAnswers } from './sessionState';
import { fetchMyOnboarding } from '@/services/onboarding';

const isKnownOption = (options, value) => options.some((o) => o.value === value);

/** 화면 답변 → POST /api/onboarding 본문 (OnboardingCreate와 같은 snake_case). */
export function toOnboardingPayload(answers) {
  return {
    user_type: answers.userType,
    experience: answers.experience,
    purposes: answers.purposes,
    // '직접 입력'은 옵션 값이 아니라 사용자가 친 문자열로 바꿔 보낸다.
    fields: answers.fields.map((f) => (f === 'custom' ? answers.fieldCustom : f)).filter(Boolean),
    stage: answers.stage,
    venue: answers.venue === 'custom' ? answers.venueCustom : answers.venue,
    result_order: buildResultOrder(answers.purposes),
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
  answers.experience = profile.experience ?? null;
  answers.purposes = profile.purposes ?? [];
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

  const venue = profile.venue ?? null;
  if (venue && !isKnownOption(VENUE_OPTIONS, venue)) {
    answers.venue = 'custom';
    answers.venueCustom = venue;
  } else {
    answers.venue = venue;
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
