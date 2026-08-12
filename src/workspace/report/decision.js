const DECISION_LABELS = {
  'accept-poster': '채택 · Poster',
  'accept-oral': '채택 · Oral',
  'accept-spotlight': '채택 · Spotlight',
  accept: '채택',
  reject: '거절',
  'desk-reject': '심사 전 거절',
  withdrawn: '철회',
};

const normalizeDecision = (decision) => (decision || '')
  .trim()
  .toLowerCase()
  .replaceAll('_', '-');

export function decisionLabel(decision) {
  const normalized = normalizeDecision(decision);
  if (DECISION_LABELS[normalized]) return DECISION_LABELS[normalized];
  if (normalized.startsWith('accept')) return '채택';
  if (normalized.includes('withdraw')) return '철회';
  if (normalized.includes('reject')) return '거절';
  return decision || '결과 미공개';
}

export function decisionTone(decision) {
  const normalized = normalizeDecision(decision);
  if (normalized.startsWith('accept')) return 'accept';
  if (normalized.includes('withdraw')) return 'withdrawn';
  if (normalized.includes('reject')) return 'reject';
  return 'neutral';
}
