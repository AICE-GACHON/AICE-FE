// 백엔드/AI 서비스 연동 지점.
// VITE_API_BASE_URL이 설정돼 있으면 실제 API를 호출하고,
// 없거나 실패하면 mock 데이터로 자동 폴백한다.
import { simulatorPanels } from '../data/simulatorData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 논문 섹션 텍스트를 넘기면 백엔드(→ AI 모델)가
 * 예상 리뷰 코멘트 + 수정 제안을 생성해서 돌려주는 걸 가정한 함수.
 * 응답 형태는 simulatorPanels 항목과 동일한 shape로 맞춰서 반환.
 */
export async function fetchReviewPrediction({ sectionKey, paperText }) {
  if (!BASE_URL) {
    return simulatorPanels.find((p) => p.id === sectionKey);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/review-prediction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionKey, paperText }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('리뷰 예측 API 실패, mock으로 대체:', err);
    return simulatorPanels.find((p) => p.id === sectionKey);
  }
}

/** 유사 논문 검색용 엔드포인트 (추후 연결) */
export async function fetchSimilarPapers(query) {
  if (!BASE_URL) return [];
  const res = await fetch(`${BASE_URL}/api/similar-papers?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}