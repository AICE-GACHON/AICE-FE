import { useState } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import Field from '@/components/Field';
import GoogleLoginButton from './GoogleLoginButton';
import { login, loginWithGoogle } from '@/services/auth';
import LegalModal from '@/features/legal/LegalModal';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = '이메일을 입력해 주세요.';
  else if (!EMAIL_RE.test(email)) errors.email = '올바른 이메일 형식이 아니에요.';
  if (!password) errors.password = '비밀번호를 입력해 주세요.';
  return errors;
}

export default function LoginPage({ onExit, onSwitchToSignup, onForgotPassword, onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [googleError, setGoogleError] = useState('');
  // 신규 가입이라 더 물어봐야 할 때만 채워진다: { idToken, needsInvite }
  //
  // needsInvite를 함께 들고 있는 이유 — 서버는 초대 코드를 **먼저** 보고(403),
  // 통과하면 약관 동의를 본다(400). 초대 코드가 설정되지 않은 서버에서는 403 없이
  // 곧장 400이 오는데, 그때도 초대 코드 입력을 필수로 요구하면 사용자는 입력할
  // 값이 없어서 가입을 끝낼 수 없다.
  const [googleSignup, setGoogleSignup] = useState(null);
  const [googleInviteCode, setGoogleInviteCode] = useState('');
  const [googleAgree, setGoogleAgree] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [openDocument, setOpenDocument] = useState(null);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      // login()은 UserResponse를 그대로 돌려준다 ({user: ...}로 감싸지 않는다).
      // /me 조회가 실패한 경우에도 { email, nickname: null }을 돌려주므로 항상 객체다.
      const user = await login({ email: form.email.trim(), password: form.password });
      onSuccess(user);
    } catch (err) {
      setSubmitError(err.message || '로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // 처음 구글로 가입하는 계정이면 백엔드가 초대 코드(403)와 약관 동의(400)를
  // 요구한다. 그때만 id_token을 잠깐 들고 있다가, 필요한 것을 받아 같은 토큰으로
  // 재시도한다. **이미 가입한 사람은 이 화면을 아예 보지 않는다** — 로그인할 때마다
  // 약관에 다시 동의시키면 그건 동의가 아니라 확인 버튼이다.
  const handleGoogleCredential = async (idToken) => {
    setGoogleError('');
    setGoogleSubmitting(true);
    try {
      const user = await loginWithGoogle(idToken);
      onSuccess(user);
    } catch (err) {
      if (err.needsInvite || err.needsConsent) {
        setGoogleSignup({ idToken, needsInvite: Boolean(err.needsInvite) });
      } else {
        setGoogleError(err.message || '구글 로그인에 실패했어요.');
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const submitGoogleSignup = async (e) => {
    e.preventDefault();
    if (googleSignup.needsInvite && !googleInviteCode.trim()) {
      setGoogleError('초대 코드를 입력해 주세요.');
      return;
    }
    if (!googleAgree) {
      setGoogleError('이용약관과 개인정보처리방침에 동의해 주세요.');
      return;
    }

    setGoogleSubmitting(true);
    setGoogleError('');
    try {
      // 베타에서는 OpenReview ID를 받지 않는다 — 서버가 자리표시자를 넣는다.
      const user = await loginWithGoogle(
        googleSignup.idToken, undefined, googleInviteCode.trim() || undefined, googleAgree,
      );
      onSuccess(user);
    } catch (err) {
      setGoogleError(err.message || '구글 로그인에 실패했어요.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <AuthLayout onExit={onExit}>
      <div className="eyebrow">로그인</div>
      <h2>다시 오신 것을 환영해요</h2>

      {googleSignup ? (
        <form className="auth-form" onSubmit={submitGoogleSignup} style={{ marginTop: 20 }}>
          <p className="onboard-desc">
            처음 구글로 가입하시네요. 아래만 확인해 주시면 가입이 끝나요.
          </p>
          {googleSignup.needsInvite && (
            <Field
              label="초대 코드"
              type="text"
              placeholder="초대받은 코드를 입력해 주세요"
              value={googleInviteCode}
              onChange={(e) => setGoogleInviteCode(e.target.value)}
            />
          )}

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={googleAgree}
              onChange={(e) => setGoogleAgree(e.target.checked)}
            />
            <span>
              <button type="button" className="legal-inline-link" onClick={() => setOpenDocument('terms')}>
                이용약관
              </button>
              과{' '}
              <button type="button" className="legal-inline-link" onClick={() => setOpenDocument('privacy')}>
                개인정보처리방침
              </button>
              에 동의합니다.
            </span>
          </label>

          {googleError && <div className="auth-submit-error">{googleError}</div>}
          <button type="submit" className="pill btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={googleSubmitting}>
            {googleSubmitting ? '확인 중…' : '계속하기'}
          </button>
          <button type="button" className="auth-switch" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setGoogleSignup(null)}>
            취소
          </button>
        </form>
      ) : (
        <>
          <GoogleLoginButton onCredential={handleGoogleCredential} />
          {googleSubmitting && <p className="auth-google-notice">구글 로그인 확인 중…</p>}
          {googleError && <p className="auth-google-notice" style={{ color: 'var(--red)' }}>{googleError}</p>}

          <div className="auth-divider"><span>또는 이메일로 로그인</span></div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Field
              label="이메일"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              error={errors.email}
            />
            <Field
              label="비밀번호"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => update({ password: e.target.value })}
              error={errors.password}
            />

            <div className="auth-forgot">
              <button type="button" onClick={onForgotPassword}>비밀번호를 잊으셨나요?</button>
            </div>

            {submitError && <div className="auth-submit-error">{submitError}</div>}

            <button type="submit" className="pill btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={submitting}>
              {submitting ? '로그인 중…' : '로그인'}
            </button>
          </form>

          <p className="auth-switch">
            아직 계정이 없으신가요? <button type="button" onClick={onSwitchToSignup}>회원가입</button>
          </p>
        </>
      )}

      {openDocument && (
        <LegalModal documentName={openDocument} onClose={() => setOpenDocument(null)} />
      )}
    </AuthLayout>
  );
}
