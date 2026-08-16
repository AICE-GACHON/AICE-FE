import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // VITE_ 접두사만 자동 노출되지만, 여기서는 가드용으로 전부 읽는다(''=접두사 없음).
  const env = loadEnv(mode, process.cwd(), '')

  // ------------------------------------------------------------------ 빌드 가드
  //
  // 🔴 VITE_API_BASE_URL이 비면 src/services/*.js가 **전부 mock 응답으로 폴백한다**
  //    (auth 3곳, submissions 3곳, onboarding 1곳, papers 1곳).
  //
  //    개발 중에는 편리한 기능이지만 배포에서는 최악이다. 가입도 로그인도 분석도
  //    전부 가짜로 "성공"하고, 화면은 멀쩡하고, 백엔드는 조용하고, DB에는 아무것도
  //    쌓이지 않는다. **아무도 이상하다고 느끼지 못한 채 며칠이 지나갈 수 있다.**
  //
  //    그래서 빌드 단계에서 끊는다. dev 서버는 그대로 둔다 — 백엔드 없이 화면만
  //    보는 것은 정상적인 개발 방식이다.
  if (command === 'build' && !env.VITE_API_BASE_URL) {
    if (env.VITE_ALLOW_MOCK_BUILD !== '1') {
      throw new Error(
        [
          '',
          'VITE_API_BASE_URL이 비어 있습니다 — 이대로 빌드하면 화면 전체가 mock으로 동작합니다.',
          '가입·로그인·분석이 모두 가짜로 성공하고 백엔드에는 아무 요청도 가지 않습니다.',
          '',
          '  배포용 빌드:  VITE_API_BASE_URL=https://paperaireview.com npm run build',
          '',
          '백엔드를 같은 도메인에서 서빙하더라도 **전체 origin**을 적어야 합니다.',
          "빈 값이나 '/'는 안 됩니다 — 코드가 `${BASE_URL}/api/...`로 이어 붙이기 때문에",
          "'/'를 주면 '//api/...'(프로토콜 상대 URL)가 되어 엉뚱한 호스트로 나갑니다.",
          '',
          '정말로 mock 빌드가 필요하면 (백엔드 없이 화면만 배포하는 등):',
          '',
          '  VITE_ALLOW_MOCK_BUILD=1 npm run build',
          '',
        ].join('\n'),
      )
    }
    // 우회했더라도 흔적은 남긴다. 나중에 "왜 mock으로 떠 있지"의 답이 여기 있다.
    console.warn(
      '\n⚠️  VITE_ALLOW_MOCK_BUILD=1 — mock 응답으로 동작하는 번들을 만듭니다.\n',
    )
  }

  // 값이 **있어도** 개발용 주소면 배포 빌드로는 쓸 수 없다. 로컬 .env에는 보통
  // http://localhost:8000이 들어 있어서, 개발 PC에서 그냥 `npm run build`를 하면
  // 그 주소가 번들에 박힌 채 배포된다. 백엔드가 production에서 평문 http origin을
  // 거부하는 것과 같은 이유로 여기서도 막는다.
  if (command === 'build' && mode === 'production' && env.VITE_API_BASE_URL) {
    const url = env.VITE_API_BASE_URL
    const isLocal = /localhost|127\.0\.0\.1/.test(url)
    const isPlain = url.startsWith('http://')
    if (isLocal || isPlain) {
      throw new Error(
        [
          '',
          `VITE_API_BASE_URL이 배포용 값이 아닙니다: ${url}`,
          isLocal ? '  · localhost 주소는 사용자의 브라우저에서 닿지 않습니다.' : '',
          isPlain ? '  · https 페이지에서 http를 부르면 브라우저가 차단합니다(mixed content).' : '',
          '',
          '  배포용 빌드:  VITE_API_BASE_URL=https://paperaireview.com npm run build',
          '',
          '로컬 주소로 빌드해야 한다면 production 모드가 아니어야 합니다:',
          '',
          '  npm run build -- --mode development',
          '',
        ].filter(Boolean).join('\n'),
      )
    }
  }

  return {
    plugins: [react()],
    // 폴더가 features/ 아래로 한 겹 깊어지면서 '../../../components/BrandMark' 같은
    // import가 생긴다. 몇 칸을 올라가는지 세는 것은 읽는 쪽에도 옮기는 쪽에도
    // 비용이라, 경계를 넘는 import는 전부 '@/...'로 적는다.
    //
    // 같은 기능 폴더 안에서는 상대 경로를 그대로 쓴다 — 그래야 그 폴더가
    // 자족적으로 남고, 통째로 옮겨도 안이 깨지지 않는다.
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
