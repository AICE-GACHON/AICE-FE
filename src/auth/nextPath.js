// 로그인 뒤 원래 가려던 곳으로 돌려보내기 위한 ?next= 처리.
//
// 앱 안의 경로만 허용한다. next는 주소창에 있어서 누구나 고쳐 넣을 수 있고,
// '//evil.com'은 브라우저가 프로토콜 상대 URL로 읽어 바깥 사이트로 나간다 —
// 로그인 페이지가 외부로 튕겨내는 통로가 되면 안 된다.
const isInternalPath = (path) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

export function safeNextPath(next, fallback = '/app') {
  return isInternalPath(next) ? next : fallback;
}
