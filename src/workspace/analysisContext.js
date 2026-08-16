// 컨텍스트 객체와 훅만 둔다. 컴포넌트와 한 파일에 섞으면 Fast Refresh가 깨져서
// (react-refresh/only-export-components) 저장할 때마다 분석 상태가 초기화된다 —
// 하필 이 상태를 지키려고 만든 파일이라 더 곤란하다.
import { createContext, useContext } from 'react';

/**
 * @typedef {{
 *   pdfFile: File | null,
 *   pdfError: string,
 *   submission: object | null,
 *   phase: 'form' | 'review' | 'working' | 'done' | 'error',
 *   statusText: string,
 *   progress: Array<{step: string, done: boolean, label: string, detail: string|null, at: string}>,
 *   report: object | null,
 *   errorMsg: string,
 *   acceptFile: (file: File | null) => void,
 *   clearFile: () => void,
 *   upload: () => Promise<void>,
 *   analyze: () => Promise<void>,
 *   reset: () => void,
 * }} AnalysisValue
 */

/** @type {import('react').Context<AnalysisValue | null>} */
export const AnalysisContext = createContext(null);

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis()는 <AnalysisProvider> 안에서만 쓸 수 있어요.');
  return ctx;
}
