# paper-trace (AICE-FE)

React + Vite 기반 프론트엔드.

```bash
npm install
npm run dev
```

`.env`는 `.env.example`을 복사해 채운다. `VITE_API_BASE_URL`이 비어 있으면 `src/services/*`가
mock 응답으로 폴백하므로 백엔드 없이도 화면은 돈다 — 다만 그 상태로는 **빌드가 막힌다**
(자세한 이유는 `vite.config.js`의 빌드 가드 주석 참고).

## 폴더 구조

```
src/
├── main.jsx                진입점 (Router · AuthProvider 마운트)
├── App.jsx                 라우터 + 전역 CSS 묶음
├── routes/                 주소 ↔ 화면 연결표
├── layouts/                여러 페이지가 공유하는 레이아웃 껍데기
├── components/             기능에 속하지 않는 진짜 공용 UI
├── features/               기능 단위 — 화면·로직·CSS를 한 폴더에
│   ├── landing/            마케팅 랜딩 (/)
│   ├── auth/               로그인·가입·비밀번호 재설정
│   ├── onboarding/         가입 전 4단계 설문
│   ├── legal/              약관·개인정보처리방침
│   ├── share/              비로그인 공개 공유 뷰 (SharedReportPage)
│   └── workspace/          로그인 후 앱 (/app)
│       ├── report/         분석 결과 화면
│       ├── story/          논문 개정 히스토리
│       └── mypage/         내 정보
├── services/               서버 통신 (fetch 래퍼 · 토큰 저장)
│   └── mocks/              VITE_API_BASE_URL이 없을 때 쓰는 폴백 데이터
├── styles/                 전역 CSS
├── assets/                 이미지·폰트 등 정적 리소스
└── dev/                    개발 전용 검증 화면 (DEV 빌드에만 라우트가 생김)
```

### 어디에 두는가

새 파일을 만들 때의 판단 순서:

1. **한 기능 안에서만 쓰나?** → `features/<기능>/` 안에 둔다. 컴포넌트든 유틸이든 CSS든
   같은 폴더에 둔다 — 같이 고칠 것들이 같이 있어야 한다.
2. **두 기능 이상이 쓰나?** → `components/`(UI) 또는 `services/`(서버 통신)로 올린다.
   지금 여기 있는 `BrandMark`·`Field`가 그렇게 올라온 것들이다.
3. **여러 페이지를 감싸는 껍데기인가?** → `layouts/`.

`hooks/`·`utils/`·`stores/` 폴더는 일부러 만들지 않았다. 공용 훅이 아직 없고, 전역 상태는
Context(`AuthProvider`, `features/workspace/AnalysisProvider`)로 충분하다. 빈 폴더를 미리 파
두면 "여기 뭘 넣어야 하지"만 남는다. 실제로 필요해지는 시점에 만든다.

### import 규칙

- **같은 기능 폴더 안** → 상대 경로 (`./OptionButton`, `../report/Summary`)
- **경계를 넘을 때** → `@/` 별칭 (`@/components/Field`, `@/services/auth`)

`@`는 `src/`를 가리킨다 (`vite.config.js`의 `resolve.alias`, 에디터 자동완성은 `jsconfig.json`).
`../../../`를 세는 대신 별칭을 쓰면 폴더를 통째로 옮겨도 안쪽 import가 깨지지 않는다.

의존 방향은 **features → services/components/layouts** 한 방향으로만 흐른다.
`services/`가 `features/`를 import하면 방향이 거꾸로 된 것이다.

## 스크립트

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 배포 빌드 (`VITE_API_BASE_URL` 필수) |
| `npm run lint` | ESLint |
| `npm run preview` | 빌드 결과 미리보기 |
