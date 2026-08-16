# [BE] 홈 사이드바 정리 기능 — 파일(폴더) · 고정 · 이동 · 이름 바꾸기 API 추가

프론트(paper-trace) 홈 사이드바에 분석 이력 정리 기능(고정 / 파일 폴더 / 이동 /
이름 바꾸기 / 공유)을 붙였습니다. 현재 고정·폴더·이동·이름은 **브라우저
localStorage에만** 저장돼 기기·브라우저가 바뀌면 따라가지 않습니다. 서버에 저장하기
위해 아래 스키마·엔드포인트가 필요합니다.

## 작업 내용

- [ ] 파일(폴더) 테이블 `folders` 추가 + submissions에 `pinned` · `folder_id` 컬럼 추가 (alembic)
- [ ] 파일(폴더) CRUD 엔드포인트 4종 추가
- [ ] `PATCH /api/submissions/{id}` 추가 — 이름 바꾸기 · 고정 · 폴더 이동 통합
- [ ] `GET /api/submissions` 응답에 `pinned` · `folder_id` 필드 추가

## 주요 변경 사항

### 1. 데이터 모델

**새 테이블 `folders`** (프론트 표기는 "파일")

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `folder_id` | UUID PK | `default uuid4` |
| `user_id` | UUID FK → `users.user_id` (`ON DELETE CASCADE`) | not null |
| `name` | `String(100)` | not null |
| `created_at` | `timestamptz` | `server_default now()` |

- 인덱스 `(user_id, created_at)`

**`submissions` 컬럼 추가** (`app/models/submission.py`)

| 컬럼 | 타입 | 기본값 | 비고 |
|---|---|---|---|
| `pinned` | `Boolean` | `false`, not null | 고정 여부 |
| `folder_id` | UUID FK → `folders.folder_id` (`ON DELETE SET NULL`) | null | 소속 폴더. NULL이면 "분석 이력"에 남음 |

- `folder_id`는 **`ON DELETE SET NULL`** 이 핵심 — 폴더를 지워도 안의 논문은 삭제되지
  않고 분석 이력으로 돌아가야 합니다(프론트 동작과 일치).
- alembic 마이그레이션 1개(테이블 생성 + 컬럼 2개). 기존 행은 `pinned=false`,
  `folder_id=null`로 백필.

### 2. 엔드포인트

모두 **로그인 필요**(Bearer), 응답은 기존 `ApiResponse[...]` 래퍼. 소유권 검증은
기존 `owned_submission`과 동일하게 `user_id` 기준.

**파일(폴더) CRUD**
```
POST   /api/folders          { name }        -> Folder (201)
GET    /api/folders          -> Folder[]
PATCH  /api/folders/{id}     { name }        -> Folder
DELETE /api/folders/{id}     -> 204          # 안의 논문은 folder_id를 NULL로
```
`Folder` 응답:
```json
{ "folder_id": "uuid", "name": "읽을거리", "created_at": "..." }
```

**submission 정리 상태 변경 (이름/고정/이동 통합)**
```
PATCH  /api/submissions/{id}  { title?, pinned?, folder_id? }  -> SubmissionResponse
```
- 세 필드 모두 선택 — 보낸 필드만 갱신(PATCH 시맨틱)
- `folder_id`: UUID면 이동, `null`이면 폴더에서 빼기. **요청자 소유 폴더인지 검증**
- `title`: 이름 바꾸기 (기존 `title` `String(300)` 상한 검증)
- `pinned`: 고정/해제

> 세 동작을 하나로 합친 건 프론트가 전부 "항목 한 줄 부분 수정"이라 교체가 단순하기
> 때문입니다. 나누는 게 낫다면 `.../pin`, `.../move`로 쪼개도 프론트에서 맞추겠습니다.

**목록 응답 확장** — `GET /api/submissions`의 `SubmissionSummary`에 추가
```
+ pinned: bool
+ folder_id: uuid | null
```

### 3. 공유 — 백엔드 작업 없음

- 링크 복사 / X / 페이스북: 프론트에서 처리(백엔드 불필요)
- 카카오톡: 프론트 Kakao JS 키만 필요
- ⚠️ 로그인 없이 열람 가능한 **진짜 공개 공유**가 필요해지면 별도 이슈로 — 공개
  조회 엔드포인트 + share token + 최소 필드 노출 + 보안 검토(**이번 범위 밖**)

## 확인 사항

- [ ] `folders` 테이블 · `submissions.pinned` / `folder_id` 마이그레이션 정상 적용 (기존 행 백필 확인)
- [ ] 폴더 CRUD 동작 및 타 사용자 폴더 접근 차단 확인
- [ ] `PATCH /api/submissions/{id}` 로 이름/고정/이동 각각·동시 갱신 확인
- [ ] 폴더 삭제 시 소속 논문의 `folder_id`가 NULL로 돌아가는지 확인 (논문 미삭제)
- [ ] `GET /api/submissions` 응답에 `pinned` · `folder_id` 포함 확인

---

_프론트 참고: 백엔드 반영 후 `src/workspace/organizeStore.js`의 저장/로드만 API로
교체하면 화면 코드(`HomeDashboard.jsx`)는 그대로입니다._
