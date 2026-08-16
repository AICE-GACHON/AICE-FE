// 공유 링크로 들어온 사람이 보는 화면 (/shared/:token). **로그인하지 않은 방문자가
// 보는 유일한 결과 화면이다.**
//
// 결과 본문은 ResultReport를 그대로 쓴다. 공개용으로 따로 만들면 confidence 경고나
// "유사도 %를 쓰지 않는다" 같은 규칙이 한쪽에만 반영되고, 그 어긋남은 하필 **가장
// 넓게 퍼지는 화면**에서 드러난다.
//
// 논문 상세는 라우트가 아니라 ResultReport의 내부 state로 연다(onOpenPaper를 넘기지
// 않으면 그렇게 동작한다). 공개 뷰에 /shared/{token}/{paperId} 같은 주소를 더 만들면
// 토큰이 붙은 주소가 종류별로 늘어나고, 그만큼 새어 나갈 자리도 늘어난다.
//
// 상세가 부르는 /api/papers/* 는 원래 인증이 없어서 비로그인으로도 그대로 열린다.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ResultReport from '@/features/workspace/ResultReport';
import { useAuth } from '@/features/auth/authContext';
import { fetchSharedAnalysis } from '@/services/share';

// 링크가 열리지 않는 경우를 **하나의 문구로** 안내한다. 서버가 사유를 구분해 주지
// 않기 때문이다(없는 토큰·폐기된 토큰·결과 없는 초안이 전부 404) — 그건 토큰을
// 찍어보는 쪽에 힌트를 주지 않으려는 설계이고, 화면이 지어내서 나눌 일이 아니다.
function DeadLink({ onGoHome }) {
  return (
    <div className="shared-page">
      <div className="wr-card shared-dead">
        <div className="wr-card-title">링크를 열 수 없어요</div>
        <p className="wr-muted">
          주소가 잘못됐거나, 공유한 사람이 공유를 중지했을 수 있어요.
          링크를 보내준 분에게 다시 요청해 주세요.
        </p>
        <button type="button" className="wr-primary" onClick={onGoHome}>
          PAIR 둘러보기
        </button>
      </div>
    </div>
  );
}

export default function SharedReportPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { status: authStatus } = useAuth();
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });
  // 토큰이 바뀌었는데 이 컴포넌트가 재사용되는(언마운트 안 되는) 경우 로딩으로
  // 되돌린다. effect 안에서 setState하면 렌더가 연쇄되므로 렌더 중에 비교한다 —
  // PastAnalysisRoute(routes/index.jsx)가 같은 상황을 같은 방식으로 푼다.
  const [loadedFor, setLoadedFor] = useState(token);
  if (token !== loadedFor) {
    setLoadedFor(token);
    setState({ status: 'loading', data: null, error: '' });
  }

  useEffect(() => {
    let alive = true;
    fetchSharedAnalysis(token)
      .then((data) => {
        if (!alive) return;
        // 서버는 분석이 done일 때만 링크를 발급하지만, 그건 발급 시점의 조건이다.
        // 방어적으로 한 번 더 본다 — report가 비면 보여줄 것이 없다.
        if (!data?.report) {
          setState({ status: 'dead', data: null, error: '' });
          return;
        }
        setState({ status: 'ready', data, error: '' });
      })
      .catch((err) => {
        if (!alive) return;
        // 404는 "링크가 죽었다"이고 나머지는 일시적 문제다. 둘을 같은 문구로
        // 뭉치면, 서버가 잠깐 흔들렸을 뿐인데 사용자는 링크를 버린다.
        if (err.status === 404) setState({ status: 'dead', data: null, error: '' });
        else setState({ status: 'error', data: null, error: err.message || '불러오지 못했어요.' });
      });
    return () => { alive = false; };
  }, [token]);

  if (state.status === 'loading') {
    return (
      <div className="story-loading">
        <div className="story-spinner" />
        <p className="wr-muted">공유된 분석을 불러오는 중…</p>
      </div>
    );
  }

  if (state.status === 'dead') return <DeadLink onGoHome={() => navigate('/')} />;

  if (state.status === 'error') {
    return (
      <div className="shared-page">
        <div className="auth-submit-error">{state.error}</div>
      </div>
    );
  }

  const { title, field, report } = state.data;

  return (
    <div className="shared-page">
      <header className="shared-head">
        <button type="button" className="shared-brand" onClick={() => navigate('/')}>
          PAIR
        </button>
        <span className="shared-badge">공유된 분석</span>
      </header>

      <div className="shared-intro">
        <h1 className="shared-title">{title}</h1>
        {field && <p className="wr-muted">{field}</p>}
      </div>

      <ResultReport report={report} />

      {/* 가입 유도는 결과 **아래**에 둔다. 먼저 값을 보여주고 권하는 순서라야
          설득이 되고, 위에 두면 결과를 가리는 광고가 된다.
          이미 로그인한 사람에게는 띄우지 않는다 — 가입하라는 말이 무의미하고,
          자기 워크스페이스로 가는 길이 더 쓸모 있다. */}
      {authStatus === 'authed' ? (
        <div className="shared-cta">
          <button type="button" className="wr-primary" onClick={() => navigate('/app')}>
            내 워크스페이스로 가기
          </button>
        </div>
      ) : (
        <div className="shared-cta">
          <h2 className="shared-cta-title">내 논문도 이렇게 분석해 보세요</h2>
          <p className="wr-muted">
            비슷한 논문들이 심사에서 실제로 어떤 지적을 받았는지, 리뷰 원문으로 확인할 수 있어요.
          </p>
          <button type="button" className="wr-primary" onClick={() => navigate('/signup')}>
            무료로 시작하기
          </button>
          <button type="button" className="onboard-back" onClick={() => navigate('/')}>
            서비스 둘러보기
          </button>
        </div>
      )}
    </div>
  );
}
