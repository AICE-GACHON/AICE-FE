import { useState } from 'react';
import { createSubmissionFromPdf, startAnalysis, pollAnalysis } from '../api/submissions';
import { loadAnswers } from '../onboarding/sessionState';
import { fieldLabel } from '../onboarding/onboardingData';
import ResultReport from './ResultReport';
import BrandMark from '../components/BrandMark';

// 온보딩에서 고른 연구 분야가 있으면 업로드 시 field 기본값으로 이어 쓴다.
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

// phase: form(업로드) → review(추출 확인) → working(분석) → done | error
export default function UploadPage({ user, onLogout }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [submission, setSubmission] = useState(null);
  const [phase, setPhase] = useState('form');
  const [statusText, setStatusText] = useState('');
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setPdfError('');
    if (!file) { setPdfFile(null); return; }
    if (file.size > MAX_PDF_BYTES) {
      setPdfError('PDF 용량이 너무 커요 (20MB 이하만 가능해요).');
      e.target.value = '';
      setPdfFile(null);
      return;
    }
    setPdfFile(file);
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
    setPdfFile(null);
    setPdfError('');
    setSubmission(null);
    setReport(null);
    setErrorMsg('');
    setPhase('form');
  };

  const pageCount = submission?.page_count;
  const isLongDocument = pageCount != null && pageCount > WARN_PAGE_COUNT;

  return (
    <div className="workspace-shell">
      <div className="workspace-topbar">
        <div className="onboard-brand">
          <BrandMark size={26} />PAIR
        </div>
        <div className="workspace-topbar-right">
          {user?.nickname && <span className="workspace-user">{user.nickname} 님</span>}
          <button type="button" className="onboard-exit" onClick={onLogout}>로그아웃</button>
        </div>
      </div>

      <div className="workspace-body">
        {(phase === 'form' || (phase === 'error' && !submission) || (phase === 'working' && !submission)) && (
          <div className="wr-card upload-card">
            <div className="wr-card-title">논문 분석</div>
            <p className="onboard-desc">
              논문 PDF를 올리면 <b>비슷한 논문들이 실제로 어떤 리뷰를 받았는지</b> 보여드려요.
            </p>

            <form onSubmit={handleUpload}>
              <div className="upload-pdf-row" style={{ marginTop: 18 }}>
                <span className="auth-field-label">논문 PDF</span>
                <input type="file" accept="application/pdf" onChange={handlePdfChange} disabled={phase === 'working'} />
                {pdfFile && (
                  <button type="button" className="upload-pdf-clear" onClick={() => setPdfFile(null)} disabled={phase === 'working'}>
                    제거
                  </button>
                )}
              </div>
              {pdfFile && (
                <div className="wr-muted" style={{ marginTop: 6 }}>
                  {pdfFile.name} · {(pdfFile.size / 1024 / 1024).toFixed(1)}MB
                </div>
              )}
              {pdfError && <div className="auth-field-error" style={{ marginTop: 6 }}>{pdfError}</div>}
              {phase === 'error' && <div className="auth-submit-error" style={{ marginTop: 14 }}>{errorMsg}</div>}

              <p className="fine" style={{ marginTop: 12 }}>
                본문과 참고문헌까지 읽어야 정확하게 고를 수 있어서 PDF 원문이 필요해요.
                스캔본도 괜찮아요 — 페이지를 그대로 읽어서 제목과 초록을 찾아냅니다.
              </p>

              <button
                type="submit"
                className="pill btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                disabled={!pdfFile || phase === 'working'}
              >
                {phase === 'working' ? `${statusText}…` : '다음'}
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
      </div>
    </div>
  );
}
