// 논문 분석의 진행 상태를 워크스페이스 전체가 공유한다.
//
// 예전에는 이 상태가 UploadPage 안에 있었고, Workspace.jsx가 그 화면을 hidden으로
// 감춰서(언마운트하지 않고) 지켜냈다. 라우터를 들이면서 화면이 진짜로 언마운트되기
// 시작했고, 분석을 돌리는 중에 내 정보를 한 번 들르면 결과가 통째로 날아갔다.
// 상태를 화면보다 위에 두면 화면이 갈려도 분석은 계속된다.
//
// 폴링 루프의 수명도 여기서 책임진다 — 워크스페이스를 떠나면 결과를 받을 곳이
// 없으므로 멈춰야 한다. 그 경계가 곧 이 Provider의 경계다.
//
// 다만 **새로고침은 그 경계가 아니다.** 분석은 서버가 돌리고 진행 상황도 DB에
// 남으므로, 탭을 다시 열면 이어서 보여줄 수 있어야 한다. 그게 없던 동안에는
// 2분짜리 작업 도중 새로고침 한 번에 화면이 통째로 사라졌다 — 서버는 멀쩡히
// 계속 돌고 있는데 사용자에게는 빈 업로드 폼만 남았다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createSubmissionFromPdf, getAnalysis, listSubmissions, startAnalysis, pollAnalysis,
} from '../api/submissions';
import { loadAnswers } from '../onboarding/sessionState';
import { fieldLabel } from '../onboarding/onboardingData';
import { AnalysisContext } from './analysisContext';

// 온보딩에서 고른 연구 분야가 있으면 업로드 시 field 기본값으로 이어 쓴다.
// sessionStorage는 로그인 직후 서버 답변으로 다시 채워진다(profileMapping.js의
// syncAnswersFromServer) — 그전에는 탭을 닫을 때마다 이 기본값이 비었다.
function defaultField() {
  const answers = loadAnswers();
  if (!answers.fields?.length) return null;
  return answers.fields
    .map((f) => (f === 'custom' && answers.fieldCustom ? answers.fieldCustom : fieldLabel(f)))
    .filter(Boolean)
    .join(', ') || null;
}

const STATUS_LABEL = { pending: '대기 중', running: '분석 중' };
// 서버와 같은 값이어야 한다 (app/routers/submissions.py). 미리 걸러 업로드를 아낀다.
const MAX_PDF_BYTES = 20 * 1024 * 1024;

// 드래그로 넣은 파일은 <input accept>를 거치지 않으므로 여기서 직접 걸러야 한다.
// 브라우저가 type을 못 알아보는 경우가 있어 확장자도 같이 본다.
const isPdf = (file) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

// phase: form(업로드) → review(추출 확인) → working(분석) → done | error
export function AnalysisProvider({ children }) {
  const navigate = useNavigate();
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [submission, setSubmission] = useState(null);
  const [phase, setPhase] = useState('form');
  const [statusText, setStatusText] = useState('');
  // 서버가 준 진행 이벤트 원본. 접는 것은 화면의 몫이다(progressSteps.js) —
  // 여기서 접어 버리면 나중에 다르게 그리고 싶을 때 원본이 없다.
  const [progress, setProgress] = useState([]);
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 워크스페이스를 벗어날 때 폴링을 끊는다. 안 끊으면 로그아웃하거나 랜딩으로
  // 나간 뒤에도 3초마다 분석 상태를 계속 물어본다.
  const pollAbortRef = useRef(null);
  useEffect(() => () => pollAbortRef.current?.abort(), []);

  // 사용자가 직접 뭔가 시작했는지. 마운트 직후의 복구 시도가 그걸 덮어쓰지 않도록
  // 하는 유일한 방어선이다 — 복구는 요청 두 번(목록 + 분석 조회)을 기다리는데,
  // 느린 회선에서는 그 사이에 사용자가 이미 파일을 고르고 업로드를 눌렀을 수 있다.
  // phase state로 판단할 수 없다: 이 값을 읽는 시점이 effect 안이라 클로저에 잡힌
  // 옛 값을 보게 된다.
  const userActedRef = useRef(false);

  // 파일 선택과 드롭이 같은 검사를 타야 한다 — 한쪽만 통과하면 서버가 400으로
  // 돌려보내고, 그 왕복은 사용자 입장에서 그냥 "업로드가 안 되는" 것으로 보인다.
  const acceptFile = useCallback((file) => {
    userActedRef.current = true;
    setPdfError('');
    if (!file) { setPdfFile(null); return; }
    if (!isPdf(file)) {
      setPdfError('PDF 파일만 올릴 수 있어요.');
      setPdfFile(null);
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setPdfError('PDF 용량이 너무 커요 (20MB 이하만 가능해요).');
      setPdfFile(null);
      return;
    }
    setPdfFile(file);
  }, []);

  const clearFile = useCallback(() => {
    setPdfFile(null);
    setPdfError('');
  }, []);

  // 끝날 때까지 지켜보다가 결과에 따라 화면을 옮긴다.
  //
  // **분석을 시작하는 경로와 새로고침 뒤 이어받는 경로가 같은 함수를 쓴다.** 둘이
  // 갈라지면 "직접 돌렸을 때는 결과로 넘어가는데 새로고침하고 기다린 경우에는
  // 안 넘어간다" 같은, 재현 조건이 좁아서 오래 살아남는 버그가 생긴다.
  const watchUntilDone = useCallback(async (submissionId, controller) => {
    const result = await pollAnalysis(submissionId, {
      signal: controller.signal,
      onTick: (data) => {
        setStatusText(STATUS_LABEL[data.status] ?? data.status);
        // 폴링 응답은 매번 지금까지의 **전체** 목록이라 그대로 갈아끼우면 된다.
        // 덕분에 폴링 간격(3초)보다 짧게 지나간 단계도 빠지지 않는다. 새로고침
        // 뒤에도 이 성질 덕에 화면이 중간부터가 아니라 처음부터 다시 채워진다.
        setProgress(data.progress ?? []);
      },
    });
    if (result.status === 'failed') {
      setErrorMsg(result.error || '분석에 실패했어요. 잠시 후 다시 시도해 주세요.');
      setPhase('error');
      return;
    }
    setReport(result.report);
    setPhase('done');
    // 결과를 별도 주소(/app/report)로 옮겨야 뒤로가기가 이 화면(업로드 폼)로
    // 돌아간다 — 그전엔 목록/상세가 전부 /app/upload 하나의 state 전환이라
    // 브라우저 히스토리에 아무 기록도 안 남았다. /app/upload 밑이 아니라
    // 별도 경로인 이유는 routes.jsx의 ReportRoute 주석 참고.
    navigate('/app/report');
  }, [navigate]);

  // 새로고침·탭 재접속 뒤 진행 중이던 분석을 이어받는다.
  //
  // 가장 최근 초안 **하나만** 본다. 화면상 분석은 한 번에 하나뿐이라(진행 중에는
  // 업로드 폼이 아예 안 보인다) 그것이 곧 방금까지 보고 있던 분석이다. 여러 건을
  // 뒤지면 워크스페이스를 열 때마다 요청만 늘고 얻는 게 없다.
  //
  // **끝난 분석은 복구하지 않는다.** 워크스페이스에 들어올 때마다 지난 결과 화면으로
  // 끌려가면 그게 더 이상하다 — 지난 분석은 "분석 이력"에 있다.
  useEffect(() => {
    const controller = new AbortController();
    pollAbortRef.current = controller;

    (async () => {
      try {
        const [latest] = await listSubmissions();
        if (!latest || userActedRef.current || controller.signal.aborted) return;

        const data = await getAnalysis(latest.submission_id);
        if (userActedRef.current || controller.signal.aborted) return;
        if (data.status !== 'pending' && data.status !== 'running') return;

        setSubmission(latest);
        setProgress(data.progress ?? []);
        setStatusText(STATUS_LABEL[data.status] ?? data.status);
        setPhase('working');
        await watchUntilDone(latest.submission_id, controller);
      } catch (err) {
        // 이어받기는 **되면 좋은 것**이다. 분석을 한 번도 안 돌린 초안이면 404가
        // 나고, 목록 조회가 실패할 수도 있다. 어느 쪽이든 사용자에게는 평소의 빈
        // 업로드 폼을 보여주는 것이 맞다 — 여기서 오류를 띄우면, 방금 워크스페이스를
        // 열었을 뿐인 사람에게 자기가 하지도 않은 일의 실패를 보여주게 된다.
        if (err.name !== 'AbortError') {
          console.info('[analysis] 진행 중이던 분석을 이어받지 못했어요:', err.message);
        }
      }
    })();

    return () => controller.abort();
  }, [watchUntilDone]);

  // 1단계: 업로드하고 서버가 뽑아낸 제목·초록을 확인받는다.
  const upload = useCallback(async () => {
    if (!pdfFile) return;
    userActedRef.current = true;
    setPhase('working');
    setErrorMsg('');
    setStatusText('업로드 중');
    try {
      const created = await createSubmissionFromPdf({ file: pdfFile, field: defaultField() });
      setSubmission(created);
      setPhase('review');
    } catch (err) {
      setErrorMsg(err.message || '업로드에 실패했어요. 잠시 후 다시 시도해 주세요.');
      setPhase('error');
    }
  }, [pdfFile]);

  // 2단계: 확인을 마치면 분석을 시작한다.
  const analyze = useCallback(async () => {
    if (!submission) return;
    userActedRef.current = true;
    setPhase('working');
    setErrorMsg('');
    setStatusText('분석 대기 중');
    // 다시 시도할 때 이전 실행의 단계가 남아 있으면 안 된다 — 서버는 새 분석마다
    // 새 행을 만들어 빈 목록으로 시작하지만, 첫 폴링이 오기 전까지의 몇 초 동안
    // 화면에는 지난번 목록이 그대로 남는다.
    setProgress([]);

    const controller = new AbortController();
    pollAbortRef.current = controller;

    try {
      await startAnalysis(submission.submission_id);
      await watchUntilDone(submission.submission_id, controller);
    } catch (err) {
      // 우리가 끊은 것 — 워크스페이스를 떠났다는 뜻이라 보여줄 화면도 이미 없다.
      if (err.name === 'AbortError') return;
      setErrorMsg(err.message || '요청에 실패했어요. 잠시 후 다시 시도해 주세요.');
      setPhase('error');
    }
  }, [submission, watchUntilDone]);

  const reset = useCallback(() => {
    userActedRef.current = true;
    pollAbortRef.current?.abort();
    setPdfFile(null);
    setPdfError('');
    setSubmission(null);
    setReport(null);
    setProgress([]);
    setErrorMsg('');
    setPhase('form');
  }, []);

  const value = useMemo(() => ({
    pdfFile, pdfError, submission, phase, statusText, progress, report, errorMsg,
    acceptFile, clearFile, upload, analyze, reset,
  }), [
    pdfFile, pdfError, submission, phase, statusText, progress, report, errorMsg,
    acceptFile, clearFile, upload, analyze, reset,
  ]);

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}
