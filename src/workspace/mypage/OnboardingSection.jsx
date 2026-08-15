import { useState } from 'react';
import OptionButton from '../../onboarding/OptionButton';
import { updateMyOnboarding } from '../../api/onboarding';
import { toOnboardingPayload, answersFromProfile } from '../../onboarding/profileMapping';
import { saveAnswers } from '../../onboarding/sessionState';
import {
  USER_TYPE_OPTIONS,
  FIELD_OPTIONS, FIELD_MAX_SELECT,
  SIMILARITY_FOCUS_OPTIONS, RECENCY_BIAS_OPTIONS,
  VENUE_OPTIONS,
  userTypeLabel, fieldLabel, similarityFocusLabel, recencyBiasLabel, venueLabel,
} from '../../onboarding/onboardingData';

const Blank = () => <span className="mypage-blank">답하지 않음</span>;

function Row({ label, children }) {
  return (
    <div className="mypage-row">
      <div className="mypage-key">{label}</div>
      <div className="mypage-val">{children}</div>
    </div>
  );
}

function Tags({ values }) {
  if (!values?.length) return <Blank />;
  return (
    <div className="mypage-tags">
      {values.map((v) => <span key={v} className="wr-pill">{v}</span>)}
    </div>
  );
}

/** 하나만 고르는 질문. 이미 고른 것을 다시 누르면 해제된다 (답을 취소할 수 있어야 한다). */
function SingleChoice({ label, options, value, onChange }) {
  return (
    <div className="mypage-edit-group">
      <div className="mypage-edit-label">{label}</div>
      <div className="mypage-edit-options">
        {options.map((o) => (
          <OptionButton
            key={o.value}
            label={o.label}
            selected={value === o.value}
            onClick={() => onChange(value === o.value ? null : o.value)}
          />
        ))}
      </div>
    </div>
  );
}

/** 여러 개 고르는 질문. 상한에 닿으면 안 고른 것들이 비활성화된다. */
function MultiChoice({ label, options, values, max, onChange }) {
  const toggle = (value) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else if (values.length < max) {
      onChange([...values, value]);
    }
  };
  return (
    <div className="mypage-edit-group">
      <div className="mypage-edit-label">
        {label} <span className="fine">최대 {max}개</span>
      </div>
      <div className="mypage-edit-options">
        {options.map((o) => (
          <OptionButton
            key={o.value}
            label={o.label}
            desc={o.desc}
            multi
            selected={values.includes(o.value)}
            disabled={!values.includes(o.value) && values.length >= max}
            onClick={() => toggle(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

export default function OnboardingSection({ status, answers, error, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const startEditing = () => {
    // 원본을 직접 건드리지 않는다 — 취소하면 되돌아가야 한다.
    setDraft({ ...(answers ?? answersFromProfile(null)) });
    setSaveError('');
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(null);
    setSaveError('');
  };

  const patch = (changes) => setDraft((d) => ({ ...d, ...changes }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      // toOnboardingPayload는 '직접 입력'을 자유 문자열로 바꾸고 result_order를
      // 목적에 맞춰 다시 만든다 — 온보딩 저장과 **같은 함수**를 쓴다. 여기서만
      // 따로 만들면 두 경로가 서서히 어긋난다.
      const profile = await updateMyOnboarding(toOnboardingPayload(draft));
      const fresh = answersFromProfile(profile);

      // sessionStorage도 같이 갱신한다. 안 하면 업로드 화면의 분야 기본값이
      // 옛 답변으로 남는다 — 분명히 고쳤는데 반영이 안 되는 것처럼 보인다.
      saveAnswers(fresh);

      onSaved(fresh);
      setEditing(false);
      setDraft(null);
    } catch (err) {
      setSaveError(err.message || '저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------- 보기 모드
  const shown = answers;
  const fieldNames = (shown?.fields ?? [])
    .map((f) => (f === 'custom' ? shown.fieldCustom : fieldLabel(f)))
    .filter(Boolean);
  // 서버가 venue를 하나만 들고 있어서(profileMapping.js) 화면도 첫 항목만 다룬다.
  const firstVenue = shown?.venues?.[0] ?? null;
  const venueName = firstVenue === 'custom' ? shown.venueCustom : venueLabel(firstVenue);
  // similarityFocus·recencyBias는 아직 서버에 없는 값이다(백엔드 미연결) — 그래서
  // shown에도 항상 null로 온다. 답 안 한 것과 "균형있게"를 고른 것이 결과적으로
  // 같으므로, 없으면 균형있게로 보여준다(다른 항목처럼 "답하지 않음"으로 두지 않는다).
  const focusText = similarityFocusLabel(shown?.similarityFocus) || '균형있게';
  const recencyText = recencyBiasLabel(shown?.recencyBias) || '균형있게';

  return (
    <div className="wr-card upload-card" style={{ marginTop: 16 }}>
      <div className="mypage-section-head">
        <div>
          <div className="wr-card-title">온보딩 답변</div>
          <p className="wr-muted" style={{ marginTop: 4 }}>
            프로필로 저장되고, 유사 논문을 찾을 때 참고할 기준으로도 쓰여요.
          </p>
        </div>
        {!editing && status !== 'loading' && status !== 'error' && (
          <button type="button" className="pill ghost mypage-edit-btn" onClick={startEditing}>
            수정
          </button>
        )}
      </div>

      {status === 'loading' && (
        <p className="wr-muted" style={{ marginTop: 16 }}>불러오는 중…</p>
      )}

      {status === 'error' && (
        <div className="auth-submit-error" style={{ marginTop: 16 }}>{error}</div>
      )}

      {!editing && status === 'empty' && (
        <div className="wr-banner" style={{ marginTop: 16 }}>
          아직 저장된 온보딩 답변이 없어요. 온보딩을 건너뛰고 가입하셨거나
          구글로 바로 가입하신 경우예요. <b>지금 채워 넣을 수 있어요.</b>
        </div>
      )}

      {!editing && status === 'ready' && (
        <div className="mypage-list" style={{ marginTop: 12 }}>
          <Row label="사용자 유형">{userTypeLabel(shown.userType) || <Blank />}</Row>
          <Row label="전공 분야"><Tags values={fieldNames} /></Row>
          <Row label="검색 우선순위">관점: {focusText} · 경향: {recencyText}</Row>
          <Row label="목표 학회">{venueName || <Blank />}</Row>
        </div>
      )}

      {/* ------------------------------------------------------------ 수정 모드 */}
      {editing && draft && (
        <div style={{ marginTop: 18 }}>
          <SingleChoice
            label="사용자 유형" options={USER_TYPE_OPTIONS}
            value={draft.userType} onChange={(v) => patch({ userType: v })}
          />
          <MultiChoice
            label="전공 분야" options={FIELD_OPTIONS} max={FIELD_MAX_SELECT}
            values={draft.fields} onChange={(v) => patch({ fields: v })}
          />
          {draft.fields.includes('custom') && (
            <input
              className="auth-input mypage-custom-input"
              value={draft.fieldCustom}
              onChange={(e) => patch({ fieldCustom: e.target.value })}
              placeholder="전공 분야를 직접 입력해 주세요"
              maxLength={100}
            />
          )}

          {/* similarityFocus·recencyBias는 백엔드에 아직 저장 필드가 없어서, 여기서
              골라도 "저장" 이후 응답엔 안 담겨 온다 — 저장하면 균형있게로 되돌아간다. */}
          <SingleChoice
            label="관점" options={SIMILARITY_FOCUS_OPTIONS}
            value={draft.similarityFocus} onChange={(v) => patch({ similarityFocus: v })}
          />
          <SingleChoice
            label="경향" options={RECENCY_BIAS_OPTIONS}
            value={draft.recencyBias} onChange={(v) => patch({ recencyBias: v })}
          />

          <SingleChoice
            label="목표 학회" options={VENUE_OPTIONS}
            value={draft.venues[0] ?? null} onChange={(v) => patch({ venues: v ? [v] : [] })}
          />
          {draft.venues.includes('custom') && (
            <input
              className="auth-input mypage-custom-input"
              value={draft.venueCustom}
              onChange={(e) => patch({ venueCustom: e.target.value })}
              placeholder="목표 학회를 직접 입력해 주세요"
              maxLength={100}
            />
          )}

          {saveError && (
            <div className="auth-submit-error" style={{ marginTop: 16 }}>{saveError}</div>
          )}

          <div className="mypage-edit-actions">
            <button type="button" className="pill ghost" onClick={cancel} disabled={saving}>
              취소
            </button>
            <button type="button" className="pill btn-lg" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
