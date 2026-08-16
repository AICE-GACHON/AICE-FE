# 백엔드 요청 — 홈 사이드바 "정리" 기능 (고정 · 파일 · 이동 · 이름 · 공유)

프론트(paper-trace) 홈 사이드바(`src/workspace/HomeDashboard.jsx`)에 ChatGPT식
정리 기능을 붙였습니다. 각 분석 이력 항목의 "…" 메뉴에서 **공유 · 이름 바꾸기 ·
고정 · 파일(폴더)로 이동 · 삭제**를 하고, 항목을 파일 폴더로 **드래그해 보관**할
수 있습니다.

> 프론트에서 "파일"이라고 부르는 것이 곧 폴더(프로젝트) 개념입니다. 아래 스키마는
> 혼동을 줄이려고 `folders`로 씁니다.

## 지금 상태 (임시)

고정 / 파일(폴더) / 이동 / 이름 바꾸기는 **현재 브라우저 localStorage에만** 저장됩니다
(`src/workspace/organizeStore.js`). 즉 기기·브라우저가 바뀌면 정리 상태가 따라가지
않습니다. 아래 백엔드가 생기면 `organizeStore.js`의 `load`/`save`만 API 호출로
바꾸면 되고, 컴포넌트(HomeDashboard)는 그대로입니다.

이미 실제 API를 쓰는 것: **삭제**(`DELETE /api/submissions/{id}`), 목록·업로드·분석.

---

## 1. 데이터 모델

### 1-1. 새 테이블 `folders`
| 컬럼 | 타입 | 비고 |
|---|---|---|
| `folder_id` | UUID PK | `default uuid4` |
| `user_id` | UUID FK → `users.user_id` `ON DELETE CASCADE` | not null |
| `name` | `String(100)` | not null |
| `created_at` | `timestamptz` | `server_default now()` |

- 인덱스: `(user_id, created_at)` — 목록 조회용.
- 소유자당 이름 중복은 막지 않아도 됩니다(사용자가 같은 이름 폴더를 둘 수 있음).

### 1-2. `submissions` 컬럼 추가 (`app/models/submission.py`)
| 컬럼 | 타입 | 기본값 | 비고 |
|---|---|---|---|
| `pinned` | `Boolean` | `false`, not null | 고정 여부 |
| `folder_id` | UUID FK → `folders.folder_id` `ON DELETE SET NULL` | null | 소속 폴더. NULL이면 "분석 이력"에 남음 |

- `folder_id`는 **`SET NULL`**이 핵심입니다. 폴더를 지워도 안의 논문은 사라지지
  않고 분석 이력으로 돌아가야 합니다(프론트 동작과 일치).
- alembic 마이그레이션 1개(테이블 생성 + 컬럼 2개 추가). 기존 행은 `pinned=false`,
  `folder_id=null`로 백필됩니다.

---

## 2. 엔드포인트

모두 **로그인 필요**(Bearer), 응답은 기존 `ApiResponse[...]` 래퍼를 따릅니다.
소유권 검증은 기존 `owned_submission`과 같은 방식으로 `user_id` 기준.

### 2-1. 파일(폴더) CRUD
```
POST   /api/folders            { name }                 -> Folder (201)
GET    /api/folders            -> Folder[] (최신순 또는 이름순)
PATCH  /api/folders/{id}       { name }                 -> Folder
DELETE /api/folders/{id}       -> 204
```
- `DELETE`는 폴더만 지우고, 그 폴더에 속한 submissions는 `folder_id`를 NULL로
  되돌립니다(`ON DELETE SET NULL`이면 DB가 자동 처리).

`Folder` 응답 형태:
```json
{ "folder_id": "uuid", "name": "내 프로젝트", "created_at": "..." }
```

### 2-2. submission 정리 상태 변경 (이름/고정/이동 통합)
```
PATCH  /api/submissions/{id}   { title?, pinned?, folder_id? }  -> SubmissionResponse
```
- 세 필드 모두 선택. 보낸 필드만 갱신(PATCH 시맨틱).
- `folder_id`: UUID면 그 폴더로 이동, `null`이면 폴더에서 빼기. **남의 폴더로는
  이동 불가**(요청자 소유 폴더인지 검증).
- `title`: 이름 바꾸기. 길이 상한은 기존 `submissions.title`(`String(300)`)에 맞춰
  검증.
- `pinned`: 고정/해제.

> 세 동작을 굳이 하나로 합친 이유는, 프론트에서 전부 "항목 한 줄의 부분 수정"이라
> 엔드포인트가 하나면 `organizeStore` 교체가 단순해지기 때문입니다. 나누고 싶으면
> `POST /api/submissions/{id}/pin`, `.../move` 식으로 쪼개도 프론트는 맞출 수 있습니다.

### 2-3. 목록 응답 확장 (`GET /api/submissions`)
`SubmissionSummary`에 두 필드 추가:
```
+ pinned: bool
+ folder_id: uuid | null
```
프론트는 이 두 값으로 고정됨 / 파일별 / 분석 이력 섹션을 나눕니다. (지금은
localStorage로 대신하고 있습니다.)

---

## 3. 공유 — **백엔드 작업은 지금 없음**

공유는 현재 **버튼 UI + 클라이언트에서 가능한 만큼**만 구현했습니다
(`src/workspace/ShareDialog.jsx`).

| 버튼 | 동작 | 백엔드 필요? |
|---|---|---|
| 링크 복사 | 현재 경로 `/app/papers/{submission_id}`를 클립보드로 복사 | ❌ |
| X(트위터) / 페이스북 | 웹 인텐트 URL로 공유창 오픈 | ❌ |
| 카카오톡 | Kakao JS SDK + JS 앱 키가 있어야 실제 전송. 지금은 버튼만(SDK 있으면 시도) | ❌ (프론트 env `VITE_KAKAO_JS_KEY`만) |

⚠️ 지금 공유 링크(`/app/papers/{id}`)는 **로그인이 필요한 경로**입니다. 링크를 받은
사람도 그 계정으로 로그인해야 열립니다.

### (미래·범위 밖) 로그인 없이 열람 가능한 진짜 공개 공유가 필요해지면
그때는 백엔드가 필요합니다. 요약만 남겨둡니다:
- `share_tokens` 테이블(token, submission_id, 만료·폐기) 또는 submission에 공개 슬러그.
- **비인증** 공개 조회 엔드포인트 `GET /api/shared/{token}` — 분석 결과만, 소유자
  개인정보·pdf_bytes 제외한 **최소 필드**만 노출.
- 프론트에 비로그인 공개 뷰 라우트.
- 보안 검토 필요(무엇을 공개할지, 검색엔진 색인 여부, 폐기 절차). **이번 범위 아님.**

---

## 4. 프론트 교체 지점 (참고)

백엔드가 준비되면 프론트에서 바꿀 곳:
- `src/workspace/organizeStore.js` — localStorage 대신 위 API 호출. 훅 인터페이스
  (`togglePin`, `createFolder`, `moveToFolder`, `setTitle`, `deleteFolder` …)는
  그대로 두면 `HomeDashboard.jsx`는 수정 불필요.
- `src/api/submissions.js` — `GET /api/submissions` 응답에 `pinned`/`folder_id`가
  실려 오면 프론트 분류가 자동으로 서버 기준이 됨.
- 새 파일 `src/api/folders.js` — 폴더 CRUD 래퍼.
