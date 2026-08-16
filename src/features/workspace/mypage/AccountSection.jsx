import { useState } from 'react';
import Field from '@/components/Field';
import { updateMe } from '@/services/auth';

// 서버 규칙과 같은 값이어야 한다 (AICE-BE app/schemas/auth.py NewPassword).
// 여기서 막는 건 왕복을 아끼려는 것뿐이고, 진짜 방어선은 서버다.
const MIN_PASSWORD = 8;
const MAX_NICKNAME = 50;
const MAX_OPENREVIEW_ID = 100;

// bcrypt는 72바이트를 넘는 입력을 조용히 잘라낸다. 서버가 422로 거절하는 규칙을
// 그대로 옮겨, 사용자가 제출하고 나서야 알게 되는 일이 없도록 한다.
// **글자 수가 아니라 바이트 수다** — 한글 25자면 이미 75바이트다.
const MAX_PASSWORD_BYTES = 72;
const byteLength = (s) => new TextEncoder().encode(s).length;

export default function AccountSection({ user, onUserChange }) {
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [openreviewId, setOpenreviewId] = useState(user?.openreview_id ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordAgain, setNewPasswordAgain] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState('');
  const [saving, setSaving] = useState(false);

  const hasPassword = user?.has_password !== false;

  // 무엇이 실제로 바뀌었는지. 안 바뀐 필드는 아예 안 보낸다 — 서버가 보낸 필드만
  // 갱신하므로, 닉네임만 고쳤는데 openreview_id까지 실어 보내면 남이 그 사이
  // 같은 ID를 채간 경우 엉뚱하게 409가 난다.
  const trimmedNickname = nickname.trim();
  const trimmedOpenreviewId = openreviewId.trim();
  const nicknameChanged = trimmedNickname !== (user?.nickname ?? '');
  const openreviewIdChanged = trimmedOpenreviewId !== (user?.openreview_id ?? '');
  const changingPassword = Boolean(currentPassword || newPassword || newPasswordAgain);
  const dirty = nicknameChanged || openreviewIdChanged || changingPassword;

  const validate = () => {
    const next = {};
    if (nicknameChanged && !trimmedNickname) next.nickname = '닉네임은 비워둘 수 없어요.';
    if (nicknameChanged && trimmedNickname.length > MAX_NICKNAME) {
      next.nickname = `${MAX_NICKNAME}자 이내로 입력해 주세요.`;
    }
    if (openreviewIdChanged && trimmedOpenreviewId.length > MAX_OPENREVIEW_ID) {
      next.openreviewId = `${MAX_OPENREVIEW_ID}자 이내로 입력해 주세요.`;
    }

    if (changingPassword) {
      if (!currentPassword) next.currentPassword = '현재 비밀번호를 입력해 주세요.';
      if (newPassword.length < MIN_PASSWORD) {
        next.newPassword = `${MIN_PASSWORD}자 이상으로 정해 주세요.`;
      } else if (byteLength(newPassword) > MAX_PASSWORD_BYTES) {
        // 한글은 글자당 3바이트다. "25자인데 왜?"가 되지 않도록 이유를 적는다.
        next.newPassword = '너무 깁니다 (한글은 25자, 영문은 72자 정도가 한계예요).';
      }
      if (newPassword !== newPasswordAgain) {
        next.newPasswordAgain = '새 비밀번호가 서로 달라요.';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setDone('');
    if (!validate()) return;

    setSaving(true);
    try {
      const updated = await updateMe({
        ...(nicknameChanged ? { nickname: trimmedNickname } : {}),
        // 빈칸으로 지우는 건 서버가 허용하지 않는다(min_length=1). 값이 있을 때만 보낸다.
        ...(openreviewIdChanged && trimmedOpenreviewId ? { openreviewId: trimmedOpenreviewId } : {}),
        ...(changingPassword ? { currentPassword, newPassword } : {}),
      });

      // 상단바의 "OO 님"까지 같이 바뀌어야 한다.
      onUserChange?.(updated);
      setNickname(updated.nickname ?? '');
      setOpenreviewId(updated.openreview_id ?? '');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordAgain('');
      setDone(changingPassword
        ? '저장했어요. 비밀번호를 바꿨으니 다른 기기에서는 다시 로그인해야 해요.'
        : '저장했어요.');
    } catch (err) {
      if (err.duplicateOpenreviewId) {
        setErrors({ openreviewId: '이미 다른 계정이 쓰고 있는 ID예요.' });
      } else if (err.status === 401) {
        setErrors({ currentPassword: '현재 비밀번호가 맞지 않아요.' });
      } else {
        setSubmitError(err.message || '저장하지 못했어요.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="wr-card wr-card-flush" onSubmit={handleSubmit}>
      <div className="wr-card-head">
        <div>
          <div className="wr-card-title">내 정보</div>
          <p className="wr-muted" style={{ marginTop: 4 }}>
            바꾸고 싶은 것만 고친 뒤 저장하면 돼요.
          </p>
        </div>
      </div>

      {/* 라벨을 입력칸 위가 아니라 왼쪽 고정 열에 세운다 — 값이 세로로 정렬돼야
          "무엇이 채워졌고 무엇이 비었는지"가 훑어서 보인다(.mypage-fields). */}
      <div className="wr-card-pad mypage-fields">
        {/* 이메일은 계정을 식별하는 값이고 변경 API가 없다 — 입력칸으로 두면
            고칠 수 있는 것처럼 보인다. 읽기 전용으로 보여만 준다. */}
        <div className="mypage-row">
          <span className="mypage-key">EMAIL</span>
          <span className="mypage-val">
            {user?.email}
            <span className="mypage-note-inline">변경할 수 없어요</span>
          </span>
        </div>

        <Field
          label="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={MAX_NICKNAME}
          autoComplete="nickname"
          error={errors.nickname}
        />

        <Field
          label="OPENREVIEW ID"
          value={openreviewId}
          onChange={(e) => setOpenreviewId(e.target.value)}
          maxLength={MAX_OPENREVIEW_ID}
          placeholder="~Hong_Gildong1"
          error={errors.openreviewId}
        />
        <p className="mypage-hint">
          {user?.openreview_id
            ? '나중에 "내가 낸 논문"을 찾아 연결하는 데 쓸 값이에요.'
            : '아직 연결하지 않았어요. 지금 넣지 않아도 서비스 이용에는 지장이 없어요.'}
        </p>

        {/* 비밀번호 */}
        <div className="mypage-subsection">
          <div className="mypage-subsection-title">비밀번호 변경</div>

          {!hasPassword ? (
            // 구글 전용 계정이다. 입력칸을 띄우면 채울 값이 없고, 보내봐야 400이다.
            // has_password가 없으면 이 분기 자체가 불가능하다 — google_linked로는
            // "구글 연동됨"과 "구글 전용"이 구분되지 않는다.
            <p className="wr-muted" style={{ marginTop: 8 }}>
              구글 로그인으로 만든 계정이라 비밀번호가 없어요. 구글 계정에서 관리해 주세요.
            </p>
          ) : (
            <>
              <Field
                label="현재 비밀번호"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                error={errors.currentPassword}
              />
              <Field
                label="새 비밀번호"
                type="password"
                placeholder="8자 이상"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                error={errors.newPassword}
              />
              <Field
                label="새 비밀번호 확인"
                type="password"
                placeholder="다시 한 번"
                value={newPasswordAgain}
                onChange={(e) => setNewPasswordAgain(e.target.value)}
                autoComplete="new-password"
                error={errors.newPasswordAgain}
              />
              <p className="mypage-hint">바꾸면 이 기기를 뺀 나머지 기기에서 로그아웃돼요.</p>
            </>
          )}
        </div>

        {submitError && (
          <div className="auth-submit-error" style={{ marginTop: 16 }}>{submitError}</div>
        )}
        {done && (
          <div className="wr-banner wr-banner-plain" style={{ marginTop: 16 }}>{done}</div>
        )}
      </div>

      <div className="wr-card-foot" style={{ justifyContent: 'flex-end' }}>
        <button type="submit" className="ws-btn" disabled={saving || !dirty}>
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>
    </form>
  );
}
