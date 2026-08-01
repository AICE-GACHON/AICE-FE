import { useState } from 'react';
import { createSubmission, createSubmissionFromPdf, startAnalysis, pollAnalysis } from '../api/submissions';
import { loadAnswers } from '../onboarding/sessionState';
import { fieldLabel } from '../onboarding/onboardingData';
import ResultReport from './ResultReport';

// 온보딩에서 고른 연구 분야가 있으면 SubmissionCreate.field 기본값으로 이어 쓴다.
function defaultField() {
  const answers = loadAnswers();
  if (!answers.fields?.length) return null;
  return answers.fields
    .map((f) => (f === 'custom' && answers.fieldCustom ? answers.fieldCustom : fieldLabel(f)))
    .filter(Boolean)
    .join(', ') || null;
}

const STATUS_LABEL = { pending: '대기 중', running: '분석 중' };
const MAX_PDF_BYTES = 20 * 1024 * 1024; // 서버(app/routers/submission.py)와 동일한 20MB 상한 — 미리 걸러 업로드를 아낀다

export default function UploadPage({ user, onLogout }) {
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [phase, setPhase] = useState('form'); // form | working | done | error
  const [statusText, setStatusText] = useState('');
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = Boolean(pdfFile) || (title.trim().length > 0 && abstract.trim().length > 0);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setPhase('working');
    setErrorMsg('');
    setStatusText('업로드 중');
    try {
      const submission = pdfFile
        ? await createSubmissionFromPdf({
            file: pdfFile,
            title: title.trim(),
            abstract: abstract.trim(),
            field: defaultField(),
          })
        : await createSubmission({
            title: title.trim(),
            abstract: abstract.trim(),
            field: defaultField(),
          });

      await startAnalysis(submission.submission_id);
      setStatusText('분석 대기 중');

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
    setTitle('');
    setAbstract('');
    setPdfFile(null);
    setPdfError('');
    setReport(null);
    setErrorMsg('');
    setPhase('form');
  };

  return (
    <div className="workspace-shell">
      <div className="workspace-topbar">
        <div className="onboard-brand">
          <span className="mark" style={{ width: 26, height: 26, fontSize: 13 }}>P</span>PaperTrace
        </div>
        <div className="workspace-topbar-right">
          {user?.nickname && <span className="workspace-user">{user.nickname} 님</span>}
          <button type="button" className="onboard-exit" onClick={onLogout}>로그아웃</button>
        </div>
      </div>

      <div className="workspace-body">
        {phase !== 'done' && (
          <div className="wr-card upload-card">
            <div className="wr-card-title">논문 분석</div>
            <p className="onboard-desc">
              제목과 초록을 입력하거나 PDF를 올리면 유사 논문 · 리뷰 지적 패턴 · 게재 경향을 분석해 드려요.
            </p>

            <form onSubmit={handleSubmit}>
              <label className="auth-field" style={{ marginTop: 18 }}>
                <span className="auth-field-label">제목 {pdfFile && <span className="onboard-optional">(PDF에서 자동 추출, 직접 입력 시 우선)</span>}</span>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="예: Graph Neural Networks for Molecular Property Prediction"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={phase === 'working'}
                />
              </label>
              <label className="auth-field" style={{ marginTop: 14 }}>
                <span className="auth-field-label">초록 {pdfFile && <span className="onboard-optional">(PDF에서 자동 추출, 직접 입력 시 우선)</span>}</span>
                <textarea
                  className="auth-input upload-textarea"
                  placeholder="논문 초록을 붙여넣으세요."
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  disabled={phase === 'working'}
                />
              </label>

              <div className="upload-pdf-row">
                <span className="auth-field-label">또는 PDF 업로드</span>
                <input type="file" accept="application/pdf" onChange={handlePdfChange} disabled={phase === 'working'} />
                {pdfFile && (
                  <button type="button" className="upload-pdf-clear" onClick={() => setPdfFile(null)} disabled={phase === 'working'}>
                    제거
                  </button>
                )}
              </div>
              {pdfFile && <div className="wr-muted" style={{ marginTop: 6 }}>{pdfFile.name} · {(pdfFile.size / 1024 / 1024).toFixed(1)}MB</div>}
              {pdfError && <div className="auth-field-error" style={{ marginTop: 6 }}>{pdfError}</div>}

              {phase === 'error' && <div className="auth-submit-error" style={{ marginTop: 14 }}>{errorMsg}</div>}

              <button
                type="submit"
                className="pill btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
                disabled={!canSubmit || phase === 'working'}
              >
                {phase === 'working' ? `${statusText}…` : '분석'}
              </button>
              {phase === 'working' && (
                <p className="fine" style={{ textAlign: 'center' }}>
                  첫 분석은 모델 로드 때문에 1~2분 정도 걸릴 수 있어요.
                </p>
              )}
            </form>
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
