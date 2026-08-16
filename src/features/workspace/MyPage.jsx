import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyOnboarding } from '@/services/onboarding';
import { answersFromProfile } from '@/features/onboarding/profileMapping';
import AccountSection from './mypage/AccountSection';
import OnboardingSection from './mypage/OnboardingSection';
import DeleteAccountSection from './mypage/DeleteAccountSection';

// embedded=true면 홈 대시보드 칸 안에 얹힌 상태 — "← 돌아가기"는 감춘다.
export default function MyPage({ user, onUserChange, onAccountDeleted, embedded = false }) {
  const navigate = useNavigate();
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

  return (
    <>
      {!embedded && (
        <div className="ws-backrow">
          <button type="button" className="onboard-back" onClick={() => navigate(-1)}>← 돌아가기</button>
        </div>
      )}

      {/* 두 칸으로 나눈다. 왼쪽은 **고치는 것**(계정 정보·비밀번호), 오른쪽은
          **확인하고 드물게 건드리는 것**(온보딩 답변·탈퇴). 예전처럼 세로로
          쌓으면 매번 쓰는 저장 버튼이 화면 중턱에 묻히고, 되돌릴 수 없는 탈퇴가
          스크롤 끝의 "다음 순서"처럼 읽힌다. */}
      <div className="mypage-grid">
        <AccountSection user={user} onUserChange={onUserChange} />

        <div className="mypage-aside">
          <OnboardingSection
            status={state.status}
            answers={state.answers}
            error={state.error}
            // 저장에 성공하면 서버가 돌려준 값으로 갈아끼운다. 로컬 draft를 그대로
            // 쓰면 서버가 정규화한 결과와 화면이 어긋날 수 있다.
            onSaved={(answers) => setState({ status: 'ready', answers, error: '' })}
          />

          <DeleteAccountSection user={user} onAccountDeleted={onAccountDeleted} />
        </div>
      </div>
    </>
  );
}
