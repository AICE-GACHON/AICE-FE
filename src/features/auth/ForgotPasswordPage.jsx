import { useState } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import Field from '@/components/Field';
import { requestPasswordReset } from '@/services/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage({ onExit, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setError('이메일을 입력해 주세요.'); return; }
    if (!EMAIL_RE.test(trimmed)) { setError('올바른 이메일 형식이 아니에요.'); return; }
    setError('');
    setSubmitError('');
    setSubmitting(true);
    try {
      await requestPasswordReset({ email: trimmed });
      setSent(true);
    } catch (err) {
      // 여기 오는 건 네트워크/서버 장애뿐이다. 가입 여부는 서버가 감추므로
      // "그런 계정 없음" 같은 실패는 애초에 내려오지 않는다.
      setSubmitError(err.message || '요청에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout onExit={onExit}>
        <div className="eyebrow">비밀번호 찾기</div>
        <h2>메일을 확인해 주세요</h2>
        {/* 가입된 이메일인지 단정하면 그 자체로 가입 여부가 드러난다.
            서버가 항상 200을 주는 이유와 같은 이유로 문구도 조건부여야 한다. */}
        <p className="onboard-desc" style={{ marginTop: 12 }}>
          <b>{email.trim()}</b> 으로 가입된 계정이 있다면 비밀번호 재설정 링크를 보내드렸어요.
        </p>
        <p className="fine" style={{ marginTop: 14 }}>
          메일이 안 보이면 스팸함도 확인해 주세요. 링크는 일정 시간이 지나면 만료돼요.
        </p>

        <button
          type="button"
          className="pill btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
          onClick={onBackToLogin}
        >
          로그인으로 돌아가기
        </button>
        <p className="auth-switch">
          메일을 못 받으셨나요? <button type="button" onClick={() => setSent(false)}>다시 보내기</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout onExit={onExit}>
      <div className="eyebrow">비밀번호 찾기</div>
      <h2>비밀번호를 잊으셨나요?</h2>
      <p className="onboard-desc" style={{ marginTop: 10 }}>
        가입하신 이메일을 알려주시면 재설정 링크를 보내드려요.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Field
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="가입하신 이메일을 입력해 주세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />

        {submitError && <div className="auth-submit-error">{submitError}</div>}

        <button
          type="submit"
          className="pill btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          disabled={submitting}
        >
          {submitting ? '보내는 중…' : '재설정 링크 받기'}
        </button>
      </form>

      <p className="auth-switch">
        비밀번호가 기억나셨나요? <button type="button" onClick={onBackToLogin}>로그인</button>
      </p>
    </AuthLayout>
  );
}
