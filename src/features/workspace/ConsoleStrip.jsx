import { useAnalysis } from './analysisContext';

// 업로드 흐름의 상태 띠 — 작업 영역 맨 위에 붙어 "지금 몇 단계이고 무엇을
// 상대로 도는가"를 한 줄로 말한다.
//
// 진행률 막대가 아니다(AnalysisProgress.jsx의 경고 참고). 남은 시간은 우리가
// 모르지만 "지금 몇 번째 칸인가"는 확실히 아는 사실이라, 아는 것만 그린다.
//
// 오른쪽 CORPUS 표기는 첫 화면에서만 뜬다. 무엇과 대조되는지는 올리기 전에
// 알아야 뜻이 있고, 분석이 시작된 뒤에는 이미 답한 질문이다.
const CORPUS = 'CORPUS · ICLR + NEURIPS 43,000편';

const STEPS = [
  ['01', 'UPLOAD'],
  ['02', 'CONFIRM'],
  ['03', 'ANALYZE'],
];

/** 지금 서 있는 칸(0-based).
 *
 * **phase만으로는 못 정한다.** UploadPage가 화면을 고를 때 쓰는 사실이 phase와
 * submission 유무 두 가지인데(UploadPage.jsx의 렌더 분기), 여기서 phase만 보면
 * 같은 phase가 서로 다른 화면을 뜻하는 자리에서 띠와 화면이 갈린다:
 *   · working + submission 없음 = 업로드하는 중이라 화면은 아직 업로드 폼인데
 *     띠는 03 ANALYZE를 가리켰다. mock에서는 업로드가 즉시 끝나 안 보이지만
 *     실제 서버에서는 20MB 업로드 + 추출이라 몇 초씩 어긋난다.
 *   · done = 결과를 보고 홈으로 돌아온 상태다. 화면은 새 업로드 폼인데 띠는
 *     03 ANALYZE에 머물러 있었다(실측: 분석 완료 후 홈 이동).
 *   · error + submission = 3단계에서 실패한 것인데 띠가 첫 칸으로 되돌아갔다.
 * 그래서 화면을 고르는 것과 같은 사실로 판단한다.
 */
function activeIndex(phase, submission) {
  if (phase === 'review') return 1;
  if ((phase === 'working' || phase === 'error') && submission) return 2;
  return 0;
}

export default function ConsoleStrip() {
  const { phase, submission } = useAnalysis();
  const active = activeIndex(phase, submission);

  // 첫 칸에 서 있을 때는 단계 표시가 정보를 주지 않는다 — 아직 아무것도 안
  // 했으니 "1/3"은 뻔한 말이다. 대신 이 화면이 무엇을 하는 자리인지를 밝힌다.
  if (active === 0) {
    return (
      <div className="ws-strip">
        <span className="ws-strip-label">NEW ANALYSIS</span>
        <span className="ws-strip-corpus">{CORPUS}</span>
      </div>
    );
  }

  return (
    <div className="ws-strip">
      <span className="ws-strip-steps">
        {STEPS.map(([no, name], i) => (
          <span key={no}>
            {i > 0 && <span className="ws-strip-slash">/</span>}
            <span
              className={
                'ws-strip-step'
                + (i < active ? ' is-done' : '')
                + (i === active ? ' is-current' : '')
              }
            >
              {no} {name}{i < active ? ' ✓' : ''}
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}
