import { useState } from 'react';
import Field from '../../auth/Field';
import { deleteMe } from '../../api/auth';

// 오타로 지나칠 수 없게 직접 입력을 요구한다. 비밀번호가 없는 구글 전용 계정에는
// 이것이 **유일한 확인 절차**다 — 서버는 토큰만으로 지워주기 때문이다.
const CONFIRM_WORD = '탈퇴';

export default function DeleteAccountSection({ user, onAccountDeleted }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmWord, setConfirmWord] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // has_password가 없으면(구버전 서버) 있는 쪽으로 본다. 없다고 가정했다가 실제로
  // 있으면 비밀번호 없이 요청해 400이 나는데, 사용자는 이유를 알 수 없다.
  const hasPassword = user?.has_password !== false;
  const canSubmit = confirmWord.trim() === CONFIRM_WORD && (!hasPassword || password.length > 0);

  const close = () => {
    setOpen(false);
    setPassword('');
    setConfirmWord('');
    setError('');
  };

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      await deleteMe(hasPassword ? { password } : {});
      // 계정이 사라졌으므로 남은 토큰은 아무 데도 쓸 수 없다. 부모가 토큰을 지우고
      // 랜딩으로 보낸다.
      onAccountDeleted?.();
    } catch (err) {
      if (err.status === 401) {
        setError('비밀번호가 맞지 않아요.');
      } else {
        setError(err.message || '탈퇴하지 못했어요.');
      }
      setDeleting(false);
    }
  };

  return (
    <div className="wr-card upload-card" style={{ marginTop: 16 }}>
      <div className="wr-card-title">회원 탈퇴</div>

      <div className="wr-banner wr-banner-danger" style={{ marginTop: 12 }}>
        탈퇴하면 <b>되돌릴 수 없어요.</b> 업로드한 논문과 분석 결과가 전부 함께 지워지고,
        같은 이메일로 다시 가입해도 복구되지 않아요.
      </div>

      {!open ? (
        <button
          type="button"
          className="pill ghost mypage-danger-btn"
          style={{ marginTop: 16 }}
          onClick={() => setOpen(true)}
        >
          탈퇴하기
        </button>
      ) : (
        <div className="auth-form" style={{ marginTop: 18 }}>
          {hasPassword ? (
            <Field
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="본인 확인을 위해 입력해 주세요"
            />
          ) : (
            <p className="wr-muted">
              구글 로그인 계정이라 비밀번호 확인 대신 아래 확인 문구만 입력하면 돼요.
            </p>
          )}

          <Field
            label={`확인을 위해 "${CONFIRM_WORD}"라고 입력해 주세요`}
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
          />

          {error && <div className="auth-submit-error">{error}</div>}

          <div className="mypage-edit-actions">
            <button type="button" className="pill ghost" onClick={close} disabled={deleting}>
              취소
            </button>
            <button
              type="button"
              className="pill mypage-danger-btn"
              onClick={handleDelete}
              disabled={!canSubmit || deleting}
            >
              {deleting ? '탈퇴 중…' : '영구 삭제'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
