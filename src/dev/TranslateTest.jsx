// 번역 버튼 수동 검증용 단독 페이지 (개발 모드에서만 뜬다).
//
// 실제 ReviewBlock을 그대로 렌더한다 — 여기서만 쓰는 사본을 만들면 정작 화면에
// 나가는 코드는 검증이 안 된다. 백엔드·로그인·분석 결과 없이 번역 동작만 보려고
// 리뷰 데이터를 고정해 뒀다.
//
// 표본을 일부러 다르게 골랐다. 번역기가 어디서 무너지는지는 문장 종류마다
// 다르기 때문이다 — 학술 용어, 수식 기호, 표 참조, 아주 짧은 문장, 아주 긴
// 덩어리, 이미 한국어인 원문이 각각 다른 실패를 만든다.
//
// 검증이 끝나면 이 파일과 routes.jsx의 /dev/translate 줄을 함께 지운다.
import { useEffect, useState } from 'react';
import ReviewBlock from '../workspace/report/ReviewBlock';
import { isTranslationAvailable } from '../api/translate';

const CASES = [
  {
    title: '1. ICLR 표준형 — 네 필드가 모두 찬 리뷰',
    note: '가장 흔한 모양. ablation·baseline·MTEB 같은 용어를 어떻게 옮기는지 본다.',
    review: {
      rating: 6,
      rating_raw: '6: marginally above the acceptance threshold',
      confidence: 4,
      summary: 'This paper proposes TempScale, a temperature scaling method that '
        + 'mitigates the anisotropy of sentence embeddings for long inputs. The '
        + 'authors observe that embedding norms collapse as sequence length grows '
        + 'and introduce a lightweight post-processing step to counteract it.',
      strengths: 'The analysis in Section 3 is clear and well motivated. The '
        + 'proposed method is simple, requires no retraining, and can be applied '
        + 'on top of any frozen encoder, which makes it practical. Results on '
        + 'MTEB are consistent across most retrieval tasks.',
      weaknesses: 'The evaluation covers only 36 of the 56 MTEB datasets, and the '
        + 'exclusion of large-scale benchmarks such as MSMARCO is not adequately '
        + 'justified. There is no ablation isolating the contribution of the '
        + 'temperature term from the normalization step. Comparison against '
        + 'existing post-processing baselines (whitening, flow-based methods) is '
        + 'missing, so the relative advantage over prior work is unclear.',
      questions: 'How does the method behave when the input length exceeds the '
        + 'encoder context window? Did the authors evaluate whether the gains hold '
        + 'for languages other than English?',
      is_unsplit: false,
    },
  },
  {
    title: '2. 2023년 이전형 — 강/약점이 안 나뉜 리뷰 본문 한 덩어리',
    note: 'is_unsplit=true. 라벨이 "리뷰 본문"으로 뜨고, 긴 텍스트 한 개를 통째로 번역한다.',
    review: {
      rating: 4,
      rating_raw: '4: Ok but not good enough - rejection',
      confidence: 3,
      weaknesses: 'The authors tackle the problem of catastrophic forgetting in '
        + 'continual learning by introducing a replay buffer weighted by gradient '
        + 'similarity. While the direction is reasonable, I have several concerns. '
        + 'First, the theoretical justification in Section 4 relies on an '
        + 'assumption of task boundary awareness that does not hold in the '
        + 'class-incremental setting the paper claims to address. Second, the '
        + 'experimental protocol differs from the standard used in prior work: the '
        + 'authors report results averaged over 3 seeds while the field convention '
        + 'is 10, and the reported variance is large enough that several of the '
        + 'claimed improvements fall within noise. Third, the comparison omits '
        + 'DER++ and FOSTER, both of which are stronger baselines than those '
        + 'included and both of which were published more than a year before this '
        + 'submission. Finally, the writing in Section 5 is difficult to follow; '
        + 'the notation for the buffer update rule changes between equations 7 and '
        + '9 without explanation. I would encourage the authors to address the '
        + 'baseline coverage and the seed count, as the core idea may well hold up '
        + 'under a more careful evaluation.',
      is_unsplit: true,
    },
  },
  {
    title: '3. 아주 짧은 리뷰 — 한 문장짜리 필드',
    note: '짧은 입력에서 문장이 잘리거나 이상하게 늘어나지 않는지 본다.',
    review: {
      rating: 8,
      rating_raw: '8: accept, good paper',
      confidence: 5,
      summary: 'A solid empirical contribution.',
      strengths: 'Clear writing. Strong results.',
      weaknesses: 'Limited novelty.',
      questions: 'Why not evaluate on ImageNet-21k?',
      is_unsplit: false,
    },
  },
  {
    title: '4. 수식·표·그림 참조가 섞인 리뷰',
    note: 'Figure 3, Table 2, O(n log n), α·β 같은 기호가 깨지지 않고 남는지 본다.',
    review: {
      rating: 5,
      rating_raw: '5: marginally below the acceptance threshold',
      confidence: 4,
      summary: 'The paper derives an O(n log n) approximation for attention and '
        + 'validates it on long-context benchmarks.',
      strengths: 'The derivation in Appendix B is rigorous, and the bound in '
        + 'Theorem 2 is tighter than the one reported in Zhang et al. (2023).',
      weaknesses: 'Figure 3 shows the error growing with sequence length, but the '
        + 'x-axis is log-scaled while Figure 4 uses a linear axis, which makes the '
        + 'two panels hard to compare. In Table 2, the reported speedup of 3.1x '
        + 'does not match the 2.4x implied by the FLOP counts in Table 1. The '
        + 'choice of α = 0.7 and β = 0.05 in Equation 12 appears arbitrary; no '
        + 'sensitivity analysis is provided.',
      questions: 'Could the authors clarify the discrepancy between Table 1 and '
        + 'Table 2? Is the bound in Theorem 2 tight when d >> n?',
      is_unsplit: false,
    },
  },
  {
    title: '5. 이미 한국어인 리뷰 — 번역 버튼이 뜨면 안 된다',
    note: '미리보기 더미 데이터가 이 경우다. 영어로 가정해 번역기에 넣으면 멀쩡한 문장이 망가진다.',
    review: {
      rating: 5,
      rating_raw: '5: marginally below the acceptance threshold',
      summary: '긴 텍스트에서 임베딩이 뭉치는 현상을 관찰하고 온도 조절로 완화하려는 시도입니다.',
      weaknesses: 'MTEB 56개 데이터셋 중 36개만 평가했고 대형 데이터셋이 제외된 이유가 불충분합니다.',
      is_unsplit: false,
    },
  },
];

export default function TranslateTest() {
  const [available, setAvailable] = useState('확인 중…');

  useEffect(() => {
    isTranslationAvailable()
      .then((ok) => setAvailable(ok ? '사용 가능' : '사용 불가 (버튼이 숨겨집니다)'));
  }, []);

  return (
    <div className="wr-stack" style={{ maxWidth: 760, margin: '32px auto', padding: '0 16px' }}>
      <div className="wr-card">
        <div className="wr-card-title">번역 버튼 검증</div>
        <p className="wr-muted" style={{ fontSize: 13 }}>
          브라우저 번역 지원 여부: <b>{available}</b>
          <br />
          <code>typeof Translator</code>:{' '}
          <b>{typeof Translator === 'undefined' ? 'undefined' : 'function'}</b>
          {' · '}보안 컨텍스트: <b>{String(window.isSecureContext)}</b>
        </p>
        <p className="wr-muted" style={{ fontSize: 12.5, marginTop: 8 }}>
          각 리뷰를 펼쳐 <b>한국어로 번역</b> → 한글 전환 → <b>영어 원문 보기</b>로
          되돌아오는지 확인한다. 되돌린 뒤 다시 누르면 재번역 없이 즉시 바뀌어야 한다.
        </p>
      </div>

      {CASES.map((c) => (
        <div className="wr-card" key={c.title}>
          <div className="wr-card-title">{c.title}</div>
          <p className="wr-muted" style={{ fontSize: 12.5 }}>{c.note}</p>
          <div className="wr-reviews">
            <ReviewBlock review={c.review} index={0} detailMode />
          </div>
        </div>
      ))}
    </div>
  );
}
