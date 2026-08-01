import { useState } from 'react';
import AuthLayout from './AuthLayout';
import Field from './Field';
import { signup, login } from '../api/auth';
import { loadAnswers } from '../onboarding/sessionState';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ nickname, email, password, confirm, openreviewId, agree }) {
  const errors = {};
  if (!nickname.trim()) errors.nickname = '닉네임을 입력해 주세요.';
  else if (nickname.trim().length > 50) errors.nickname = '닉네임은 50자 이내로 입력해 주세요.';
  if (!email.trim()) errors.email = '이메일을 입력해 주세요.';
  else if (!EMAIL_RE.test(email)) errors.email = '올바른 이메일 형식이 아니에요.';
  if (!password) errors.password = '비밀번호를 입력해 주세요.';
  else if (password.length < 8) errors.password = '비밀번호는 8자 이상이어야 해요.';
  if (confirm !== password) errors.confirm = '비밀번호가 일치하지 않아요.';
  if (!openreviewId.trim()) errors.openreviewId = 'OpenReview ID를 입력해 주세요.';
  else if (openreviewId.trim().length > 100) errors.openreviewId = 'OpenReview ID가 너무 길어요.';
  if (!agree) errors.agree = '이용약관과 개인정보처리방침에 동의해 주세요.';
  return errors;
}

export default function SignupPage({ onExit, onSwitchToLogin, onSuccess }) {
  const [form, setForm] = useState({
    nickname: '', email: '', password: '', confirm: '', openreviewId: '', agree: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const email = form.email.trim();
    const nickname = form.nickname.trim();
    const openreviewId = form.openreviewId.trim();
    // 온보딩 3단계에서 저장된 onboarding_id가 있으면 이번 가입 요청에 실어 보내
    // 서버가 그 답변을 이 계정에 연결하게 한다 (app/routers/auth.py signup).
    const onboardingId = loadAnswers().onboardingId || undefined;

    setSubmitting(true);
    setSubmitError('');
    try {
      await signup({ email, password: form.password, nickname, openreviewId, onboardingId });
      // 회원가입 API는 토큰을 주지 않으므로, 가입 직후 같은 자격증명으로 바로 로그인해서 이어준다.
      const user = await login({ email, password: form.password });
      onSuccess(user);
    } catch (err) {
      setSubmitError(err.message || '회원가입에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout onExit={onExit}>
      <div className="eyebrow">회원가입</div>
      <h2>계정을 만들고 분석을 시작하세요</h2>
      <p className="onboard-desc">온보딩에서 답변해 주신 내용은 가입과 동시에 계정에 연결돼요.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Field
          label="닉네임"
          type="text"
          autoComplete="nickname"
          value={form.nickname}
          onChange={(e) => update({ nickname: e.target.value })}
          error={errors.nickname}
        />
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
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => update({ password: e.target.value })}
          error={errors.password}
        />
        <Field
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => update({ confirm: e.target.value })}
          error={errors.confirm}
        />
        <Field
          label="OpenReview ID"
          type="text"
          placeholder="openreview.net 계정 아이디"
          value={form.openreviewId}
          onChange={(e) => update({ openreviewId: e.target.value })}
          error={errors.openreviewId}
        />
        <p className="fine" style={{ marginTop: -8 }}>
          계정이 없으신가요? <a href="https://openreview.net/signup" target="_blank" rel="noopener noreferrer">openreview.net에서 무료로 만들 수 있어요</a>.
        </p>

        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(e) => update({ agree: e.target.checked })}
          />
          <span><a href="#terms">이용약관</a>과 <a href="#privacy">개인정보처리방침</a>에 동의합니다.</span>
        </label>
        {errors.agree && <span className="auth-field-error">{errors.agree}</span>}

        {submitError && <div className="auth-submit-error">{submitError}</div>}

        <button type="submit" className="pill btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={submitting}>
          {submitting ? '가입 처리 중…' : '계정 만들기'}
        </button>
      </form>

      <p className="auth-switch">
        이미 계정이 있으신가요? <button type="button" onClick={onSwitchToLogin}>로그인</button>
      </p>
    </AuthLayout>
  );
}
