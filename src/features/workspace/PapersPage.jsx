import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listSubmissions, deleteSubmission } from '@/services/submissions';

// 교수님 피드백 1번 — "분석시켰던 결과를 저장해서 다시 보고 싶다"는 요청으로
// 추가한 화면. 처음엔 마이 페이지 안에 얹었다가, 성격이 다른 화면이라
// (계정 설정 vs 내가 분석한 논문들) 별도 페이지로 분리했다 — 상단바에 "분석 이력"
// 버튼으로 들어온다(WorkspaceShell).
//
// 목록은 가볍게(GET /api/submissions, 초록·리포트 없음)만 받고, 실제 리포트는
// 눌렀을 때 routes/index.jsx의 PastAnalysisRoute가 그 submission_id로 따로 불러온다.
function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

// embedded=true면 홈 대시보드 칸 안에 얹힌 상태다 — 그 경우 "← 돌아가기"와
// 자체 제목/설명은 감춘다(대시보드 칸이 제목·전체보기 링크를 대신 갖는다).
export default function PapersPage({ embedded = false }) {
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', submissions: [], error: '' });
  // 삭제는 되돌릴 수 없다(FK CASCADE로 분석 결과까지 같이 지워진다) — 누르자마자
  // 지우지 않고, 그 자리에서 한 번 더 확인받는다. confirmingId가 열린 줄을 가리킨다.
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let alive = true;
    listSubmissions()
      .then((data) => { if (alive) setState({ status: 'ready', submissions: data, error: '' }); })
      .catch((err) => {
        if (!alive) return;
        setState({ status: 'error', submissions: [], error: err.message || '불러오지 못했어요.' });
      });
    return () => { alive = false; };
  }, []);

  const handleDelete = async (submissionId) => {
    setDeletingId(submissionId);
    setDeleteError('');
    try {
      await deleteSubmission(submissionId);
      setState((s) => ({
        ...s,
        submissions: s.submissions.filter((sub) => sub.submission_id !== submissionId),
      }));
      setConfirmingId(null);
    } catch (err) {
      setDeleteError(err.message || '지우지 못했어요.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="wr-stack papers-page">
      {/* 종합 리뷰·상세 화면에서 "← 분석 이력으로"를 눌러 여기 들어온 경우,
          그 화면으로 되짚어 갈 방법이 없었다 — navigate(-1)로 왔던 곳(리포트든
          업로드 화면이든)을 그대로 돌려준다. */}
      {!embedded && (
        <button type="button" className="onboard-back" onClick={() => navigate(-1)}>← 돌아가기</button>
      )}
      <div className="wr-card upload-card">
        {!embedded && (
          <>
            <div className="wr-card-title">분석 이력</div>
            <p className="wr-muted" style={{ marginTop: 4 }}>
              분석시켰던 논문들이에요. 눌러서 그때 받은 결과를 다시 볼 수 있어요.
            </p>
          </>
        )}

        {state.status === 'loading' && (
          <p className="wr-muted" style={{ marginTop: 16 }}>불러오는 중…</p>
        )}
        {state.status === 'error' && (
          <div className="auth-submit-error" style={{ marginTop: 16 }}>{state.error}</div>
        )}
        {deleteError && (
          <div className="auth-submit-error" style={{ marginTop: 16 }}>{deleteError}</div>
        )}

        {state.status === 'ready' && (
          state.submissions.length > 0 ? (
            <ul className="papers-list" style={{ marginTop: 12 }}>
              {state.submissions.map((s) => (
                <li key={s.submission_id} className="papers-item">
                  {confirmingId === s.submission_id ? (
                    <div className="papers-confirm">
                      <span>이 논문의 분석 이력을 지울까요? 되돌릴 수 없어요.</span>
                      <div className="papers-confirm-actions">
                        <button
                          type="button"
                          className="pill ghost"
                          onClick={() => setConfirmingId(null)}
                          disabled={deletingId === s.submission_id}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className="papers-delete-confirm-btn"
                          onClick={() => handleDelete(s.submission_id)}
                          disabled={deletingId === s.submission_id}
                        >
                          {deletingId === s.submission_id ? '지우는 중…' : '지우기'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="rp-item papers-open-btn"
                        onClick={() => navigate(`/app/papers/${s.submission_id}`)}
                      >
                        <span className="rp-main">
                          <span className="rp-title">{s.title || '제목 없음'}</span>
                          <span className="wr-muted">
                            {s.field ? `${s.field} · ` : ''}{formatDate(s.created_at)}
                          </span>
                        </span>
                        <span className="rp-chev" aria-hidden="true">›</span>
                      </button>
                      <button
                        type="button"
                        className="papers-delete-btn"
                        onClick={() => setConfirmingId(s.submission_id)}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="wr-banner" style={{ marginTop: 16 }}>
              아직 분석시킨 논문이 없어요. 논문을 올려서 분석해 보면 여기 쌓여요.
            </div>
          )
        )}
      </div>
    </div>
  );
}
