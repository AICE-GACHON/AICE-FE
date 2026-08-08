import { useEffect, useState } from 'react';
import { fetchMyOnboarding } from '../api/onboarding';
import { answersFromProfile } from '../onboarding/profileMapping';
import {
  userTypeLabel, experienceLabel, purposeLabel, fieldLabel, stageLabel, venueLabel,
} from '../onboarding/onboardingData';

function Row({ label, children }) {
  return (
    <div className="mypage-row">
      <div className="mypage-key">{label}</div>
      <div className="mypage-val">{children}</div>
    </div>
  );
}

const Blank = () => <span className="mypage-blank">답하지 않음</span>;

function Tags({ values }) {
  if (!values?.length) return <Blank />;
  return (
    <div className="mypage-tags">
      {values.map((v) => <span key={v} className="wr-pill">{v}</span>)}
    </div>
  );
}

export default function MyPage({ user }) {
  const [state, setState] = useState({ status: 'loading', answers: null, error: '' });

  useEffect(() => {
    let alive = true;
    fetchMyOnboarding()
      .then((profile) => {
        if (!alive) return;
        // 404는 null로 온다 — 오류가 아니라 "아직 답변 없음"이다.
        if (!profile) { setState({ status: 'empty', answers: null, error: '' }); return; }
        setState({ status: 'ready', answers: answersFromProfile(profile), error: '' });
      })
      .catch((err) => {
        if (!alive) return;
        setState({ status: 'error', answers: null, error: err.message || '불러오지 못했어요.' });
      });
    return () => { alive = false; };
  }, []);

  const { status, answers, error } = state;

  // '직접 입력'으로 고른 항목은 옵션 라벨이 아니라 사용자가 쓴 문자열을 보여준다.
  const fieldNames = (answers?.fields ?? [])
    .map((f) => (f === 'custom' ? answers.fieldCustom : fieldLabel(f)))
    .filter(Boolean);
  const purposeNames = (answers?.purposes ?? []).map(purposeLabel).filter(Boolean);
  const venueName = answers?.venue === 'custom' ? answers.venueCustom : venueLabel(answers?.venue);

  return (
    <>
      <div className="wr-card upload-card">
        <div className="wr-card-title">내 정보</div>
        <div className="mypage-list" style={{ marginTop: 8 }}>
          <Row label="닉네임">{user?.nickname || <Blank />}</Row>
          <Row label="이메일">{user?.email || <Blank />}</Row>
          <Row label="OpenReview ID">
            {/* 서버가 아직 안 채운 계정은 null로 내려준다 (자리표시자는 가려진다). */}
            {user?.openreview_id || <span className="mypage-blank">아직 연결하지 않음</span>}
          </Row>
        </div>
      </div>

      <div className="wr-card upload-card" style={{ marginTop: 16 }}>
        <div className="wr-card-title">온보딩 답변</div>
        <p className="wr-muted" style={{ marginTop: 4 }}>
          가입할 때 답해주신 내용이에요. 분석 결과를 맞추는 데 쓰여요.
        </p>

        {status === 'loading' && (
          <p className="wr-muted" style={{ marginTop: 16 }}>불러오는 중…</p>
        )}

        {status === 'error' && (
          <div className="auth-submit-error" style={{ marginTop: 16 }}>{error}</div>
        )}

        {status === 'empty' && (
          <div className="wr-banner" style={{ marginTop: 16 }}>
            아직 저장된 온보딩 답변이 없어요. 온보딩을 건너뛰고 가입하셨거나
            구글로 바로 가입하신 경우예요.
          </div>
        )}

        {status === 'ready' && (
          <div className="mypage-list" style={{ marginTop: 12 }}>
            <Row label="사용자 유형">{userTypeLabel(answers.userType) || <Blank />}</Row>
            <Row label="논문 경험">{experienceLabel(answers.experience) || <Blank />}</Row>
            <Row label="이용 목적"><Tags values={purposeNames} /></Row>
            <Row label="관심 분야"><Tags values={fieldNames} /></Row>
            <Row label="진행 단계">{stageLabel(answers.stage) || <Blank />}</Row>
            <Row label="목표 학회">{venueName || <Blank />}</Row>
          </div>
        )}

        {/* 수정은 서버에 PATCH /api/user/me/onboarding(upsert)이 생긴 뒤에 붙인다.
            지금 "수정" 버튼을 두면 눌러도 저장할 곳이 없다. */}
        <p className="fine" style={{ marginTop: 16 }}>
          답변 수정은 곧 열려요.
        </p>
      </div>
    </>
  );
}
