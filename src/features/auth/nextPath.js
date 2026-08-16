// 로그인 뒤 원래 가려던 곳으로 돌려보내기 위한 ?next= 처리.
//
// 앱 안의 경로만 허용한다. next는 주소창에 있어서 누구나 고쳐 넣을 수 있고,
// '//evil.com'은 브라우저가 프로토콜 상대 URL로 읽어 바깥 사이트로 나간다 —
// 로그인 페이지가 외부로 튕겨내는 통로가 되면 안 된다.
const isInternalPath = (path) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

// 기본값이 '/app'이 아니라 '/'인 이유 — 랜딩이 로그인 여부와 상관없이
// 메인 화면 역할을 한다(LandingPage.jsx). ?next= 없이 그냥 로그인만 했으면
// (즉 특정 보호 페이지를 보려다 온 게 아니면) 그 메인 화면으로 보낸다.
export function safeNextPath(next, fallback = '/') {
  return isInternalPath(next) ? next : fallback;
}
