import { useState } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import Field from '@/components/Field';
import { resetPassword } from '@/services/auth';

// 서버 규칙: 8자 이상, 최대 72바이트. 한글이 UTF-8로 3바이트라 "한글이면 24자"가
// 되는 것이고, 실제 상한은 글자 수가 아니라 바이트 수다(bcrypt가 72바이트에서
// 자른다). 그래서 영문/한글 섞인 비밀번호도 정확히 걸러지도록 바이트로 센다.
const MAX_PASSWORD_BYTES = 72;
const byteLength = (s) => new TextEncoder().encode(s).length;

function validate({ password, confirm }) {
  const errors = {};
  if (!password) errors.password = '새 비밀번호를 입력해 주세요.';
  else if (password.length < 8) errors.password = '비밀번호는 8자 이상이어야 해요.';
  else if (byteLength(password) > MAX_PASSWORD_BYTES) {
    errors.password = '비밀번호가 너무 길어요 (영문 72자, 한글 24자까지 돼요).';
  }
  if (confirm !== password) errors.confirm = '비밀번호가 일치하지 않아요.';
  return errors;
}

export default function ResetPasswordPage({ token, onExit, onBackToLogin, onRequestNewLink }) {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [linkDead, setLinkDead] = useState(false);
  const [done, setDone] = useState(false);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      await resetPassword({ token, newPassword: form.password });
      setDone(true);
    } catch (err) {
      // 만료·재사용 토큰은 여기서 다시 시도해봐야 소용이 없다. 입력을 고치라는
      // 에러가 아니라 "링크를 다시 받으세요"로 화면 자체를 바꾼다.
      if (err.tokenInvalid) setLinkDead(true);
      else setSubmitError(err.message || '비밀번호 재설정에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // 링크에 token이 없으면(직접 주소를 친 경우 등) 폼을 보여줄 이유가 없다.
  if (!token || linkDead) {
    return (
      <AuthLayout onExit={onExit}>
        <div className="eyebrow">비밀번호 재설정</div>
        <h2>{token ? '링크가 만료됐어요' : '올바르지 않은 링크예요'}</h2>
        <p className="onboard-desc" style={{ marginTop: 12 }}>
          {token
            ? '이미 사용했거나 유효 기간이 지난 링크예요. 재설정 링크를 다시 받아주세요.'
            : '메일에 있는 링크를 그대로 눌러 주세요. 주소가 잘린 것 같다면 다시 받아주세요.'}
        </p>

        <button
          type="button"
          className="pill btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
          onClick={onRequestNewLink}
        >
          재설정 링크 다시 받기
        </button>
        <p className="auth-switch">
          <button type="button" onClick={onBackToLogin}>로그인으로 돌아가기</button>
        </p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout onExit={onExit}>
        <div className="eyebrow">비밀번호 재설정</div>
        <h2>비밀번호를 바꿨어요</h2>
        <p className="onboard-desc" style={{ marginTop: 12 }}>
          새 비밀번호로 로그인해 주세요.
        </p>
        <button
          type="button"
          className="pill btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
          onClick={onBackToLogin}
        >
          로그인하러 가기
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout onExit={onExit}>
      <div className="eyebrow">비밀번호 재설정</div>
      <h2>새 비밀번호를 정해주세요</h2>
      <p className="onboard-desc" style={{ marginTop: 10 }}>
        8자 이상으로 입력해 주세요.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Field
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => update({ password: e.target.value })}
          error={errors.password}
        />
        <Field
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => update({ confirm: e.target.value })}
          error={errors.confirm}
        />

        {submitError && <div className="auth-submit-error">{submitError}</div>}

        <button
          type="submit"
          className="pill btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          disabled={submitting}
        >
          {submitting ? '바꾸는 중…' : '비밀번호 바꾸기'}
        </button>
      </form>

      <p className="auth-switch">
        <button type="button" onClick={onBackToLogin}>로그인으로 돌아가기</button>
      </p>
    </AuthLayout>
  );
}
