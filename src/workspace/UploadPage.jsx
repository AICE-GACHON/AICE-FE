import { useRef, useState } from 'react';
import { createSubmissionFromPdf, startAnalysis, pollAnalysis } from '../api/submissions';
import { loadAnswers } from '../onboarding/sessionState';
import { fieldLabel } from '../onboarding/onboardingData';
import ResultReport from './ResultReport';

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
// 서버의 _WARN_PAGE_COUNT와 같다. 서버는 이 값을 강제하지 않고 page_count만 내려주며,
// "논문이 맞는지" 확인은 여기서 한다 — 경고는 UX이고 거부는 안전장치라 자리가 다르다.
const WARN_PAGE_COUNT = 15;

// 드래그로 넣은 파일은 <input accept>를 거치지 않으므로 여기서 직접 걸러야 한다.
// 브라우저가 type을 못 알아보는 경우가 있어 확장자도 같이 본다.
const isPdf = (file) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

function UploadIcon() {
  return (
    <svg className="upload-drop-icon" width="34" height="34" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  );
}

// phase: form(업로드) → review(추출 확인) → working(분석) → done | error
// 상단바는 WorkspaceShell이 그린다 (내 정보 화면과 공유).
export default function UploadPage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [phase, setPhase] = useState('form');
  const [statusText, setStatusText] = useState('');
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const busy = phase === 'working';

  // 파일 선택과 드롭이 같은 검사를 타야 한다 — 한쪽만 통과하면 서버가 400으로
  // 돌려보내고, 그 왕복은 사용자 입장에서 그냥 "업로드가 안 되는" 것으로 보인다.
  const acceptFile = (file) => {
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
  };

  const handlePdfChange = (e) => {
    acceptFile(e.target.files?.[0] ?? null);
    // 같은 파일을 지웠다가 다시 고를 때도 change가 뜨도록 비워둔다.
    e.target.value = '';
  };

  const clearFile = () => {
    setPdfFile(null);
    setPdfError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openPicker = () => {
    if (!busy) fileInputRef.current?.click();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    acceptFile(e.dataTransfer.files?.[0] ?? null);
  };

  // 1단계: 업로드하고 서버가 뽑아낸 제목·초록을 확인받는다.
  const handleUpload = async (e) => {
    e.preventDefault();
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
  };

  // 2단계: 확인을 마치면 분석을 시작한다.
  const handleAnalyze = async () => {
    setPhase('working');
    setErrorMsg('');
    setStatusText('분석 대기 중');
    try {
      await startAnalysis(submission.submission_id);
      const result = await pollAnalysis(submission.submission_id, {
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
      setErrorMsg(err.message || '요청에 실패했어요. 잠시 후 다시 시도해 주세요.');
      setPhase('error');
    }
  };

  const reset = () => {
    clearFile();
    setSubmission(null);
    setReport(null);
    setErrorMsg('');
    setPhase('form');
  };

  const pageCount = submission?.page_count;
  const isLongDocument = pageCount != null && pageCount > WARN_PAGE_COUNT;

  return (
    <>
        {(phase === 'form' || (phase === 'error' && !submission) || (phase === 'working' && !submission)) && (
          <div className="wr-card upload-card">
            <div className="wr-card-title">논문 분석</div>
            <p className="onboard-desc">
              논문 PDF를 올리면 <b>비슷한 논문들이 실제로 어떤 리뷰를 받았는지</b> 보여드려요.
            </p>

            <form onSubmit={handleUpload}>
              <div className="upload-pdf-head">
                <span className="auth-field-label">논문 PDF</span>
              </div>

              {/* 존 전체가 클릭 대상이지만 포커스는 안쪽 버튼이 받는다 —
                  div에 role=button을 주고 그 안에 또 버튼을 넣으면 중첩이 된다. */}
              <div
                className={
                  'upload-drop'
                  + (dragging ? ' is-dragging' : '')
                  + (pdfFile ? ' has-file' : '')
                  + (busy ? ' is-disabled' : '')
                }
                onClick={pdfFile ? undefined : openPicker}
                onDragOver={(e) => { e.preventDefault(); if (!busy && !pdfFile) setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  disabled={busy}
                  className="upload-drop-input"
                  tabIndex={-1}
                />

                {pdfFile ? (
                  <div className="upload-file">
                    <div className="upload-file-meta">
                      <div className="upload-file-name">{pdfFile.name}</div>
                      <div className="upload-file-size">
                        {(pdfFile.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                    <div className="upload-file-actions">
                      <button type="button" className="upload-pdf-clear" onClick={openPicker} disabled={busy}>
                        바꾸기
                      </button>
                      <button type="button" className="upload-pdf-clear" onClick={clearFile} disabled={busy}>
                        제거
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadIcon />
                    <div className="upload-drop-title">
                      {dragging ? '여기에 놓으면 돼요' : 'PDF를 여기로 끌어다 놓으세요'}
                    </div>
                    <div className="upload-drop-hint">PDF · 최대 20MB</div>
                    <button
                      type="button"
                      className="upload-drop-browse"
                      onClick={(e) => { e.stopPropagation(); openPicker(); }}
                      disabled={busy}
                    >
                      파일 선택
                    </button>
                  </>
                )}
              </div>
              {pdfError && <div className="auth-field-error" style={{ marginTop: 8 }}>{pdfError}</div>}
              {phase === 'error' && <div className="auth-submit-error" style={{ marginTop: 14 }}>{errorMsg}</div>}

              <p className="fine" style={{ marginTop: 12 }}>
                본문과 참고문헌까지 읽어야 정확하게 고를 수 있어서 PDF 원문이 필요해요.
                스캔본도 괜찮아요 — 페이지를 그대로 읽어서 제목과 초록을 찾아냅니다.
              </p>

              <button
                type="submit"
                className="pill btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                disabled={!pdfFile || busy}
              >
                {busy ? `${statusText}…` : '다음'}
              </button>
            </form>
          </div>
        )}

        {phase === 'review' && (
          <div className="wr-card upload-card">
            <div className="wr-card-title">이 논문이 맞나요?</div>
            <p className="onboard-desc">PDF에서 이렇게 읽었어요. 다르면 다시 올려 주세요.</p>

            {isLongDocument && (
              <div className="wr-banner" style={{ marginTop: 14 }}>
                <span aria-hidden="true">ℹ️</span> {pageCount}페이지 문서예요.
                논문 PDF가 맞는지 확인해 주세요 — 분량이 많으면 분석에 시간이 더 걸려요.
              </div>
            )}

            <div className="upload-extracted">
              <div className="auth-field-label">제목</div>
              <div className="wr-query-title">{submission.title}</div>
              <div className="auth-field-label" style={{ marginTop: 14 }}>초록</div>
              <div className="wr-muted upload-extracted-abstract">{submission.abstract}</div>
              {pageCount != null && (
                <div className="wr-muted" style={{ marginTop: 10 }}>{pageCount}페이지</div>
              )}
            </div>

            <div className="upload-review-actions">
              <button type="button" className="onboard-back" onClick={reset}>← 다시 올리기</button>
              <button type="button" className="pill btn-lg" onClick={handleAnalyze}>분석 시작</button>
            </div>
          </div>
        )}

        {phase === 'working' && submission && (
          <div className="wr-card upload-card">
            <div className="wr-card-title">{statusText}…</div>
            <p className="onboard-desc">
              비슷한 논문을 찾고, 그중 정말 비슷한 것을 골라 리뷰를 모으고 있어요.
            </p>
            <p className="fine">첫 분석은 모델 로드 때문에 1~2분 정도 걸릴 수 있어요.</p>
          </div>
        )}

        {phase === 'error' && submission && (
          <div className="wr-card upload-card">
            <div className="wr-card-title">분석에 실패했어요</div>
            <div className="auth-submit-error" style={{ marginTop: 12 }}>{errorMsg}</div>
            <div className="upload-review-actions">
              <button type="button" className="onboard-back" onClick={reset}>← 처음부터</button>
              <button type="button" className="pill btn-lg" onClick={handleAnalyze}>다시 시도</button>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <>
            <button type="button" className="onboard-back" style={{ marginBottom: 12 }} onClick={reset}>
              ← 새 논문 분석하기
            </button>
            <ResultReport report={report} />
          </>
        )}
    </>
  );
}
