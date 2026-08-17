import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubmissionsHistory } from './submissionsContext';

// 교수님 피드백 1번 — "분석시켰던 결과를 저장해서 다시 보고 싶다"는 요청으로
// 추가한 화면. 처음엔 마이 페이지 안에 얹었다가, 성격이 다른 화면이라
// (계정 설정 vs 내가 분석한 논문들) 별도 페이지로 분리했다 — 상단바에 "분석 이력"
// 버튼으로 들어온다(WorkspaceShell).
//
// 목록은 가볍게(GET /api/submissions, 초록·리포트 없음)만 받고, 실제 리포트는
// 눌렀을 때 routes/index.jsx의 PastAnalysisRoute가 그 submission_id로 따로 불러온다.
// "2026-08-16 14:02". ko-KR 기본 형식("2026. 08. 16. 오후 2:02")은 글자 폭이
// 행마다 달라져 모노 열로 세워도 자리가 맞지 않는다 — 표에서는 정렬이 형식보다
// 중요하므로 ISO에 가까운 고정폭 표기를 쓴다.
function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// embedded=true면 홈 대시보드 칸 안에 얹힌 상태다 — 그 경우 "← 메인으로"와
// 자체 제목/설명은 감춘다(대시보드 칸이 제목·전체보기 링크를 대신 갖는다).
export default function PapersPage({ embedded = false }) {
  const navigate = useNavigate();
  // 목록은 SubmissionsProvider가 라우터 전체 위에서 들고 있다 — 여기서 지우면
  // 홈 사이드바(ConsoleLayout)도 같은 배열을 보고 있어 새로고침 없이 곧바로 반영된다.
  const { items, status, removeSubmission } = useSubmissionsHistory();
  // 삭제는 되돌릴 수 없다(FK CASCADE로 분석 결과까지 같이 지워진다) — 누르자마자
  // 지우지 않고, 그 자리에서 한 번 더 확인받는다. confirmingId가 열린 줄을 가리킨다.
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async (submissionId) => {
    setDeletingId(submissionId);
    setDeleteError('');
    try {
      await removeSubmission(submissionId);
      setConfirmingId(null);
    } catch (err) {
      setDeleteError(err.message || '지우지 못했어요.');
    } finally {
      setDeletingId(null);
    }
  };

  const rows = items;

  return (
    <div className="papers-page">
      {/* 분석 상세(PastAnalysisRoute)의 "← 분석 이력으로"가 고정 주소로 여기
          들어온다 — navigate(-1)을 쓰면 그 화면과 여기가 서로를 다시 push하며
          되돌아가는 왕복이 끝없이 쌓인다(상세→여기→상세→…). 여기서도 고정
          주소(메인)로 나가야 그 고리가 끊긴다. */}
      {!embedded && (
        <div className="ws-backrow">
          <button type="button" className="onboard-back" onClick={() => navigate('/')}>← 메인으로</button>
        </div>
      )}

      <div className="wr-card wr-card-flush">
        {!embedded && (
          <div className="wr-card-head">
            <div>
              <div className="wr-card-title">분석 이력</div>
              <p className="wr-muted" style={{ marginTop: 5 }}>
                분석시켰던 논문들이에요. 눌러서 그때 받은 결과를 다시 볼 수 있어요.
              </p>
            </div>
            <span className="wr-card-head-meta">{rows.length} SUBMISSIONS</span>
          </div>
        )}

        {status === 'loading' && (
          <p className="wr-muted wr-card-pad">불러오는 중…</p>
        )}
        {status === 'error' && (
          <div className="wr-card-pad"><div className="auth-submit-error">불러오지 못했어요.</div></div>
        )}
        {deleteError && (
          <div className="wr-card-pad"><div className="auth-submit-error">{deleteError}</div></div>
        )}

        {status === 'ready' && (
          rows.length > 0 ? (
            <>
              <div className="papers-row papers-row-head">
                <span>TITLE</span><span>DATE</span><span /><span />
              </div>
              <ul className="papers-list">
                {rows.map((s) => (
                  <li key={s.submission_id}>
                    {confirmingId === s.submission_id ? (
                      // 삭제 확인은 그 줄을 대신 차지한다 — 별도 모달을 띄우면
                      // "어느 줄을 지우는 건지"가 화면에서 사라진다.
                      <div className="papers-confirm">
                        <span>이 논문의 분석 이력을 지울까요? 되돌릴 수 없어요.</span>
                        <div className="papers-confirm-actions">
                          <button
                            type="button"
                            className="ws-btn ws-btn-ghost papers-confirm-cancel"
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
                      <div className="papers-row papers-row-item">
                        <button
                          type="button"
                          className="papers-open-btn"
                          onClick={() => navigate(`/app/papers/${s.submission_id}`)}
                        >
                          <span className="papers-title">{s.title || '제목 없음'}</span>
                          {s.field && <span className="papers-field">{s.field}</span>}
                        </button>
                        <span className="papers-date">{formatDate(s.created_at)}</span>
                        <button
                          type="button"
                          className="papers-delete-btn"
                          onClick={() => setConfirmingId(s.submission_id)}
                        >
                          삭제
                        </button>
                        <span className="rp-chev" aria-hidden="true">›</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="wr-card-pad">
              <div className="wr-banner">
                아직 분석시킨 논문이 없어요. 논문을 올려서 분석해 보면 여기 쌓여요.
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
