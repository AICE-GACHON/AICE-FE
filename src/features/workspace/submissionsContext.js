// 컨텍스트 객체와 훅만 둔다 — analysisContext.js와 같은 이유(Fast Refresh 보호)로 분리한다.
import { createContext, useContext } from 'react';

/**
 * @typedef {{
 *   items: object[],
 *   status: 'loading' | 'ready' | 'error',
 *   refresh: () => Promise<void>,
 *   removeSubmission: (submissionId: string) => Promise<void>,
 *   addSubmission: (submission: object) => void,
 * }} SubmissionsValue
 */

/** @type {import('react').Context<SubmissionsValue | null>} */
export const SubmissionsContext = createContext(null);

export function useSubmissionsHistory() {
  const ctx = useContext(SubmissionsContext);
  if (!ctx) throw new Error('useSubmissionsHistory()는 <SubmissionsProvider> 안에서만 쓸 수 있어요.');
  return ctx;
}
