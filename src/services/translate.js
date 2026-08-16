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

async function attempt(text, onProgress) {
  const translator = await getTranslator(onProgress);
  return translator.translate(text);
}

async function translateOne(text, onProgress) {
  try {
    return await attempt(text, onProgress);
  } catch {
    // 모델을 막 내려받은 직후 첫 번역이 실패하는 걸 실측했다 — 그대로 다시
    // 누르면 됐다. 다운로드는 끝났지만 번역기가 아직 못 쓰는 상태인 것으로
    // 보인다. 사용자에게 실패를 보여주고 직접 다시 누르게 하는 대신, 번역기를
    // 버리고 한 번만 조용히 다시 만들어 시도한다.
    translatorPromise = null;
    return attempt(text, onProgress);
  }
}

// 문장 끝이 아닌 마침표가 학술 리뷰에는 널려 있다 — "et al.", "e.g.", "Fig. 3".
// 이걸 문장 경계로 오해하면 조각이 엉뚱하게 잘려서 번역이 오히려 더 나빠진다.
// 마침표로 끝나는 흔한 약어를 알고 있다가, 그런 조각은 다음 조각과 도로 붙인다.
//
// ⚠️ 숫자나 대문자 한 글자로 끝나는 경우는 **일부러 넣지 않았다.** "0.05" 같은
// 소수는 마침표 뒤에 공백이 없어 애초에 잘리지 않고, "Table 1." · "Appendix B."는
// 리뷰에서 문장을 끝내는 아주 흔한 형태다. 이걸 약어로 취급했더니 멀쩡한 두
// 문장이 하나로 들러붙었다(실측).
const ABBREV_END = /\b(?:et al|e\.g|i\.e|cf|vs|resp|approx|w\.r\.t|Fig|Eq|Sec|Tab|Ref|Alg|Thm|Def|Prop|Dr|Prof)\.$/i;

function splitSentences(line) {
  // 마침표·물음표·느낌표 뒤에 공백이 오는 자리를 문장 경계 후보로 본다.
  const chunks = line.split(/(?<=[.!?])\s+/);
  const sentences = [];
  let buf = '';

  for (const chunk of chunks) {
    buf = buf ? `${buf} ${chunk}` : chunk;
    if (ABBREV_END.test(buf)) continue;   // 약어로 끝났으면 아직 문장이 안 끝났다
    sentences.push(buf);
    buf = '';
  }
  if (buf) sentences.push(buf);
  return sentences;
}

// 절(clause) 단위로 한 번 더 쪼개는 것도 시도했지만 **되돌렸다.** 긴 복문의
// 뒷절이 사라지는 문제를 노렸는데, 그 절만 따로 떼어 넘겨도 누락은 그대로였고
// (입력 길이 문제가 아니라 번역기가 "is tighter than the one reported in
// <인용>" 구문 자체를 못 다룬다), 대신 퇴행이 생겼다 — "유도"가 "파생"이 되고
// "정리 2"가 "Theorem 2"로 안 옮겨져 같은 화면 안에서 표기가 어긋났다.
// 문장보다 잘게 쪼개면 문맥이 모자라 번역이 나빠진다는 쪽이 실측 결론이다.

// 번역기가 ML 용어를 일상어로 옮겨버리는 걸 되돌린다. 실측에서 나온 것들이다 —
// whitening을 화장품 "미백"으로, ablation을 외과 "절제"로, seed를 식물 "종자"로
// 옮긴다. 어색한 정도가 아니라 읽는 사람이 딴 걸 떠올리는 오역이다.
//
// **일부러 보수적으로 골랐다.** 일상어로도 쓰이는 단어는 넣지 않았다. 특히
// attention이 "주의"로 옮겨지는 게 이 코퍼스에서 제일 잦은데도 넣지 않았다 —
// "주의"는 멀쩡한 한국어라, 무턱대고 바꾸면 진짜 '주의'를 말하는 문장을 망친다.
// 여기 있는 것들은 ML 리뷰 맥락에서 다른 뜻으로 쓰일 일이 거의 없는 말들뿐이다.
const GLOSSARY = [
  ['미백', '화이트닝'],
  ['절제', '애블레이션'],
  ['종자', '시드'],
  ['계급 증분', '클래스 증분'],
  ['임베딩 규범', '임베딩 노름'],
  ['재교육', '재학습'],
  ['빡빡', '타이트'],
];

// ⚠️ 단어를 바꾸면 **뒤에 붙은 조사가 깨진다.** "절제가"를 그대로 치환하면
// "애블레이션가"가 된다 — 받침이 생겼으니 "이"여야 한다. 백엔드가 같은 문제를
// 같은 방식으로 푼다(query/narrative.py의 조사 선택).
const PARTICLE_FORMS = [
  ['이', '가'], ['은', '는'], ['을', '를'], ['과', '와'], ['으로', '로'],
];
const PARTICLE_RE = '(으로|로|이|가|은|는|을|를|과|와)?';

function hasFinalConsonant(word) {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return null;   // 한글 음절이 아니면 판단 불가
  return (code - 0xAC00) % 28 !== 0;
}

function pickParticle(word, particle) {
  if (!particle) return '';
  const final = hasFinalConsonant(word);
  if (final === null) return particle;

  for (const [withFinal, withoutFinal] of PARTICLE_FORMS) {
    if (particle !== withFinal && particle !== withoutFinal) continue;
    // "으로/로"만 예외다 — ㄹ 받침 뒤에는 받침이 있어도 "로"를 쓴다.
    if (withFinal === '으로' && (word.charCodeAt(word.length - 1) - 0xAC00) % 28 === 8) {
      return '로';
    }
    return final ? withFinal : withoutFinal;
  }
  return particle;
}

function fixTerms(text) {
  return GLOSSARY.reduce((acc, [from, to]) => {
    const re = new RegExp(from + PARTICLE_RE, 'g');
    return acc.replace(re, (_, particle) => to + pickParticle(to, particle));
  }, text);
}

/**
 * 영어 텍스트를 한국어로 옮긴다. 반드시 사용자 클릭 핸들러 안에서 부를 것.
 *
 * 긴 문단을 통째로 넘기지 않고 **문장 단위로 쪼개서** 번역한 뒤 도로 잇는다.
 * 통째로 넘겼을 때 긴 복문의 뒷절이 통째로 사라지는 걸 실측했다("~보다 더
 * 타이트하다"가 누락돼 칭찬의 근거가 없어졌다). 한 번에 넘기는 양이 작을수록
 * 그 위험이 줄고, 브라우저가 거는 입력 한도에도 여유가 생긴다.
 *
 * ⚠️ 완화지 해결이 아니다. 기계번역인 이상 누락 가능성은 남으므로 원문 토글을
 * 반드시 함께 제공해야 한다.
 *
 * @param {string} text
 * @param {{onProgress?: (ratio: number) => void}} [opts]
 * @returns {Promise<string>}
 */
export async function translateToKorean(text, { onProgress } = {}) {
  const hit = cache.get(text);
  if (hit !== undefined) return hit;

  // 리뷰 본문은 white-space:pre-wrap으로 그려진다(workspace.css). 줄바꿈이 곧
  // 문단 구분이라 살려서 돌려줘야 한다 — 전부 한 줄로 이어붙이면 화면이 뭉갠다.
  const out = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) { out.push(line); continue; }

    const parts = [];
    for (const sentence of splitSentences(line)) {
      parts.push(await translateOne(sentence, onProgress));
    }
    out.push(fixTerms(parts.join(' ')));
  }

  const translated = out.join('\n');
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
