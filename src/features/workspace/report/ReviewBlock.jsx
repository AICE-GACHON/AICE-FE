import { useEffect, useRef, useState } from 'react';
import { isTranslationAvailable, looksTranslatable, translateToKorean } from '@/services/translate';

// 리뷰 한 건 — 접힌 채로 점수만 보이고, 펼치면 본문이 나온다.
// 목록 화면(SelectedPapers, 랜딩 시뮬레이터)과 상세 화면(PaperDetail)이 함께 쓴다.
//
// is_unsplit 리뷰는 강/약점이 분리되지 않아 weaknesses에 **본문 전체**가 들어 있다.
// '약점'이라고 라벨을 붙이면 안 되고 '리뷰 본문' 한 덩어리로 보여준다.
//
// 리뷰 원문은 영어다. 기본은 원문 그대로 보여주고, 버튼을 누른 리뷰만 한국어로
// 바꾼다 — 펼치지도 않은 리뷰까지 미리 번역하면 첫 화면이 그만큼 늦어진다.

// 번역해서 보여줄 필드. 라벨과 짝지어 두면 렌더에서 원문/번역을 같은 자리에
// 꽂을 수 있다.
const TRANSLATABLE_FIELDS = ['summary', 'strengths', 'weaknesses', 'questions'];

export default function ReviewBlock({ review, index, detailMode = false, open: controlledOpen, onToggle }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const itemRef = useRef(null);
  const open = controlledOpen ?? internalOpen;
  const score = review.rating != null ? `${review.rating}점` : '점수 없음';

  // 'off'면 원문, 'on'이면 번역문. 번역해둔 뒤에도 원문으로 되돌릴 수 있어야
  // 한다 — 기계번역은 ablation·baseline 같은 용어를 어색하게 옮기고, 리뷰는
  // 근거로 읽는 글이라 원문 대조를 막으면 안 된다.
  const [showKorean, setShowKorean] = useState(false);
  const [translated, setTranslated] = useState(null);
  const [status, setStatus] = useState('idle');   // idle | loading | error
  const [progress, setProgress] = useState(0);
  const [canTranslate, setCanTranslate] = useState(false);

  // 리뷰 목록은 key={index}로 그려지므로, 다른 논문으로 옮겨가도 같은 자리의
  // ReviewBlock이 재사용될 수 있다(언마운트되지 않는다). 그때 번역 상태를
  // 안 지우면 새 리뷰 자리에 이전 논문의 번역문이 그대로 남는다. effect 대신
  // 렌더 중에 되돌린다 — BodyDiffPanel의 selected 리셋과 같은 패턴이다.
  const [seenReview, setSeenReview] = useState(review);
  if (review !== seenReview) {
    setSeenReview(review);
    setShowKorean(false);
    setTranslated(null);
    setStatus('idle');
  }

  // 원문이 이미 한국어인 경우(미리보기 더미 데이터)에는 물어볼 것도 없다.
  const hasEnglishBody = TRANSLATABLE_FIELDS.some((f) => looksTranslatable(review[f]));

  useEffect(() => {
    if (!hasEnglishBody) return undefined;
    let alive = true;
    isTranslationAvailable().then((ok) => { if (alive) setCanTranslate(ok); });
    return () => { alive = false; };
  }, [hasEnglishBody]);

  useEffect(() => {
    if (!detailMode || !open) return undefined;

    const frame = requestAnimationFrame(() => {
      const item = itemRef.current;
      if (!item) return;
      const rect = item.getBoundingClientRect();
      const viewportGap = 16;
      const isClipped = rect.top < viewportGap || rect.bottom > window.innerHeight - viewportGap;
      if (!isClipped) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({
        top: rect.top - viewportGap,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [detailMode, open]);

  const toggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen((value) => !value);
  };

  // ⚠️ 이 핸들러 안에서 곧장 번역기를 만들어야 한다. 모델을 아직 안 받았으면
  // Translator.create()가 사용자 제스처를 요구하는데, 여기서 다른 걸 먼저
  // await하면 그 자격이 만료될 수 있다.
  const toggleKorean = async () => {
    if (showKorean) { setShowKorean(false); return; }
    if (translated) { setShowKorean(true); return; }   // 한 번 번역한 건 다시 안 부른다

    setStatus('loading');
    setProgress(0);
    try {
      const targets = TRANSLATABLE_FIELDS.filter((f) => review[f]);
      // 한 번에 하나씩 부른다. 예전엔 Promise.all로 네 필드를 동시에 던졌는데,
      // 모델을 막 내려받은 직후에는 그중 하나가 "아직 준비 안 됨"으로 실패하고
      // Promise.all은 하나만 실패해도 전체를 실패로 떨어뜨렸다(첫 시도는 실패,
      // 다시 누르면 성공하는 증상의 원인). 순서대로 부르면 첫 호출이 다운로드와
      // 재시도를 다 흡수하고, 나머지는 준비된 번역기를 그대로 쓴다.
      const out = {};
      for (const f of targets) {
        out[f] = await translateToKorean(review[f], { onProgress: setProgress });
      }
      setTranslated(out);
      setShowKorean(true);
      setStatus('idle');
    } catch {
      // 번역 실패로 리뷰를 못 읽게 만들지는 않는다 — 원문은 그대로 남는다.
      setStatus('error');
    }
  };

  // 번역을 켠 상태면 번역문에서, 아니면 원문에서 꺼낸다.
  const body = showKorean && translated ? { ...review, ...translated } : review;

  return (
    <div ref={itemRef} className={`wr-review${detailMode ? ' is-detail' : ''}${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="wr-review-head"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="wr-review-no">리뷰 {index + 1}</span>
        <span className="wr-review-score">{review.rating_raw || score}</span>
        <span className="wr-review-toggle" aria-hidden={detailMode ? 'true' : undefined}>
          {detailMode ? (open ? '−' : '+') : (open ? '접기' : '펼치기')}
        </span>
      </button>
      {open && (
        <div className="wr-review-body">
          {canTranslate && (
            <div className="wr-review-translate">
              <button
                type="button"
                className={`wr-translate-btn${showKorean ? ' is-on' : ''}`}
                onClick={toggleKorean}
                disabled={status === 'loading'}
              >
                {status === 'loading'
                  ? (progress > 0 && progress < 1
                    ? `번역 모델 준비 중… ${Math.round(progress * 100)}%`
                    : '번역 중…')
                  : (showKorean ? '영어 원문 보기' : '한국어로 번역')}
              </button>
              {/* "어색할 수 있다"로는 부족하다 — 실측에서 긴 문장의 뒷절이 통째로
                  누락돼 리뷰어의 판단 근거가 사라진 적이 있다. 어투 문제가 아니라
                  내용이 빠질 수 있다는 걸 밝혀야 원문을 확인하게 된다. */}
              {showKorean && (
                <span className="wr-translate-note">
                  기계 번역이라 내용이 빠질 수 있어요 — 중요한 판단은 원문으로 확인하세요
                </span>
              )}
              {status === 'error' && (
                <span className="wr-translate-error">번역에 실패했어요. 잠시 후 다시 시도해 주세요.</span>
              )}
            </div>
          )}

          {body.summary && (
            <div className="wr-review-part">
              <div className="wr-review-part-label">요약</div>
              <p>{body.summary}</p>
            </div>
          )}
          {body.weaknesses && (
            <div className="wr-review-part">
              <div className="wr-review-part-label">
                {review.is_unsplit ? '리뷰 본문' : '지적받은 점'}
              </div>
              {/* 접힌 머리줄에 배지로 얹었더니 점수 문구가 길 때 두 줄로 접히며
                  깨졌다 — 펼쳤을 때만, 그리고 실제로 뜻이 통하는 이 자리에서만
                  캡션으로 설명한다. */}
              {review.is_unsplit && (
                <p className="wr-review-part-caption">
                  이 학회는 강점/약점을 나눠 받지 않아서 리뷰 본문 전체가 들어 있어요
                </p>
              )}
              <p>{body.weaknesses}</p>
            </div>
          )}
          {!review.is_unsplit && body.strengths && (
            <div className="wr-review-part">
              <div className="wr-review-part-label">좋게 본 점</div>
              <p>{body.strengths}</p>
            </div>
          )}
          {body.questions && (
            <div className="wr-review-part">
              <div className="wr-review-part-label">질문</div>
              <p>{body.questions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
