// 브라우저 내장 번역기(Translator API) 래퍼 — 리뷰 원문을 한국어로 옮긴다.
//
// 서버를 거치지 않는다. Chrome/Edge가 기기에 내려받아 둔 모델로 번역하므로
// 호출 비용이 0이고(백엔드 레이트리밋·LLM 예산과 무관하다), 리뷰 본문이 밖으로
// 나가지도 않는다. 대신 이 API가 없는 브라우저(Safari·Firefox)에서는 아무것도
// 못 한다 — 그래서 지원 여부를 먼저 묻고, 안 되면 호출부가 버튼 자체를 숨긴다.
// 못 쓰는 버튼을 띄워두고 눌렀을 때 실패를 알리는 것보다 낫다.
//
// ⚠️ HTTPS(보안 컨텍스트)에서만 동작한다. localhost는 보안 컨텍스트로 쳐주므로
// 개발 중에는 그대로 되지만, 배포를 http로 하면 조용히 사라진다.

const SOURCE = 'en';
const TARGET = 'ko';

// 표준화가 진행 중인 API라 브라우저 버전에 따라 반환값 이름이 다르다.
// 현행은 available/downloadable/downloading/unavailable이고, 초기 구현은
// readily/after-download/no를 썼다. 둘 다 받아준다 — 어느 쪽이든 "쓸 수 있는
// 상태"인지만 알면 된다.
const USABLE = new Set(['available', 'downloadable', 'downloading',
  'readily', 'after-download']);

// ⚠️ `Translator`가 있다고 실제로 동작하는 건 아니다. 껍데기만 있고 뒤를
// 받쳐주는 서비스가 없는 런타임(Electron 기반 브라우저에서 실측)에서는
// availability()가 **거부되지도 않고 영원히 대기한다.** 그래서 실패가 아니라
// 무응답을 기준으로 끊는다 — 이게 없으면 지원 여부가 영영 확정되지 않는다.
// 이 값은 로컬 조회라 정상 브라우저에서는 즉시 답이 온다.
const PROBE_TIMEOUT_MS = 3000;

// 한 페이지에 리뷰 블록이 스무 개씩 깔리는데(논문 5편 × 리뷰 4건) 각자 따로
// 물으면 같은 답을 스무 번 계산한다. 첫 물음만 실제로 하고 나머지는 그 약속을
// 나눠 쓴다.
let availabilityPromise = null;

export function isTranslationAvailable() {
  if (availabilityPromise) return availabilityPromise;

  availabilityPromise = (async () => {
    if (typeof Translator === 'undefined') return false;

    const probe = Translator.availability({
      sourceLanguage: SOURCE, targetLanguage: TARGET,
    }).then((state) => USABLE.has(state));

    const timeout = new Promise((resolve) => {
      setTimeout(() => resolve(false), PROBE_TIMEOUT_MS);
    });

    try {
      // 무응답이면 timeout 쪽이 먼저 false로 끝난다. 지원 여부를 묻다가 실패한
      // 경우도 마찬가지로 '지원 안 함'이다 — 여기서 던지면 번역과 아무 상관없는
      // 리뷰 화면 전체가 죽는다.
      return await Promise.race([probe, timeout]);
    } catch {
      return false;
    }
  })();

  return availabilityPromise;
}

// 번역기 인스턴스는 하나만 만들어 모든 리뷰가 나눠 쓴다. 리뷰마다 새로 만들면
// 그때마다 모델을 다시 붙잡는다.
let translatorPromise = null;

function getTranslator(onProgress) {
  if (!translatorPromise) {
    // ⚠️ 모델이 아직 없으면(downloadable) 이 호출은 **사용자 제스처 안에서만**
    // 허용된다. 그 밖에서 부르면 NotAllowedError다. 그래서 이 함수는 버튼
    // onClick에서만 부르고, 화면에 뜨자마자 미리 만들어두지 않는다.
    translatorPromise = Translator.create({
      sourceLanguage: SOURCE,
      targetLanguage: TARGET,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          // e.loaded는 0~1. 첫 사용자만 겪는 수십 MB 다운로드라, 진행률을
          // 안 보여주면 버튼이 먹통인 줄 안다.
          onProgress?.(e.loaded);
        });
      },
    }).catch((err) => {
      // 실패한 약속을 붙들고 있으면 다음 시도까지 영원히 같은 에러를 받는다.
      translatorPromise = null;
      throw err;
    });
  }
  return translatorPromise;
}

// 같은 리뷰를 접었다 펴거나 목록↔상세를 오갈 때 다시 번역하지 않는다.
// 원문이 키다 — 같은 문장은 어느 논문의 리뷰든 결과가 같다.
const cache = new Map();

/**
 * 영어 텍스트를 한국어로 옮긴다. 반드시 사용자 클릭 핸들러 안에서 부를 것.
 * @param {string} text
 * @param {{onProgress?: (ratio: number) => void}} [opts]
 * @returns {Promise<string>}
 */
export async function translateToKorean(text, { onProgress } = {}) {
  const hit = cache.get(text);
  if (hit !== undefined) return hit;

  const translator = await getTranslator(onProgress);
  const translated = await translator.translate(text);
  cache.set(text, translated);
  return translated;
}

const HANGUL = /[가-힣]/g;

/**
 * 이 텍스트에 번역 버튼을 달아도 되는지. 미리보기 모드의 더미 리뷰
 * (mockSelectedPapers.js)는 이미 한국어라, 영어로 가정하고 번역기에 넣으면
 * 멀쩡한 문장이 망가진다. 원문이 이미 한국어면 버튼을 감춘다.
 */
export function looksTranslatable(text) {
  if (!text) return false;
  const hangul = (text.match(HANGUL) || []).length;
  return hangul / text.length < 0.1;
}
