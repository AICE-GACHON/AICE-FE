// 논문 분석의 진행 상태를 워크스페이스 전체가 공유한다.
//
// 예전에는 이 상태가 UploadPage 안에 있었고, Workspace.jsx가 그 화면을 hidden으로
// 감춰서(언마운트하지 않고) 지켜냈다. 라우터를 들이면서 화면이 진짜로 언마운트되기
// 시작했고, 분석을 돌리는 중에 내 정보를 한 번 들르면 결과가 통째로 날아갔다.
// 상태를 화면보다 위에 두면 화면이 갈려도 분석은 계속된다.
//
// 폴링 루프의 수명도 여기서 책임진다 — 워크스페이스를 떠나면 결과를 받을 곳이
// 없으므로 멈춰야 한다. 그 경계가 곧 이 Provider의 경계다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSubmissionFromPdf, startAnalysis, pollAnalysis } from '../api/submissions';
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
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [submission, setSubmission] = useState(null);
  const [phase, setPhase] = useState('form');
  const [statusText, setStatusText] = useState('');
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 워크스페이스를 벗어날 때 폴링을 끊는다. 안 끊으면 로그아웃하거나 랜딩으로
  // 나간 뒤에도 3초마다 분석 상태를 계속 물어본다.
  const pollAbortRef = useRef(null);
  useEffect(() => () => pollAbortRef.current?.abort(), []);

  // 파일 선택과 드롭이 같은 검사를 타야 한다 — 한쪽만 통과하면 서버가 400으로
  // 돌려보내고, 그 왕복은 사용자 입장에서 그냥 "업로드가 안 되는" 것으로 보인다.
  const acceptFile = useCallback((file) => {
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

  // 1단계: 업로드하고 서버가 뽑아낸 제목·초록을 확인받는다.
  const upload = useCallback(async () => {
    if (!pdfFile) return;
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
    setPhase('working');
    setErrorMsg('');
    setStatusText('분석 대기 중');

    const controller = new AbortController();
    pollAbortRef.current = controller;

    try {
      await startAnalysis(submission.submission_id);
      const result = await pollAnalysis(submission.submission_id, {
        signal: controller.signal,
        onTick: (data) => setStatusText(STATUS_LABEL[data.status] ?? data.status),
      });
      if (result.status === 'failed') {
        setErrorMsg(result.error || '분석에 실패했어요. 잠시 후 다시 시도해 주세요.');
        setPhase('error');
        return;
      }
      setReport(result.report);
      setPhase('done');
    } catch (err) {
      // 우리가 끊은 것 — 워크스페이스를 떠났다는 뜻이라 보여줄 화면도 이미 없다.
      if (err.name === 'AbortError') return;
      setErrorMsg(err.message || '요청에 실패했어요. 잠시 후 다시 시도해 주세요.');
      setPhase('error');
    }
  }, [submission]);

  const reset = useCallback(() => {
    pollAbortRef.current?.abort();
    setPdfFile(null);
    setPdfError('');
    setSubmission(null);
    setReport(null);
    setErrorMsg('');
    setPhase('form');
  }, []);

  const value = useMemo(() => ({
    pdfFile, pdfError, submission, phase, statusText, report, errorMsg,
    acceptFile, clearFile, upload, analyze, reset,
  }), [
    pdfFile, pdfError, submission, phase, statusText, report, errorMsg,
    acceptFile, clearFile, upload, analyze, reset,
  ]);

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}
