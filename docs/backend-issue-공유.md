# [BE] 분석 결과 공유 — 로그인 없이 열람 가능한 공개 공유 링크

프론트 홈 사이드바에 공유 기능을 붙였습니다. 링크 복사 · X · 페이스북 · 카카오톡은
**프론트만으로 동작**하지만, 지금 공유 링크(`/app/papers/{submission_id}`)는
**로그인이 필요한 경로**라 링크를 받은 사람이 그 계정으로 로그인해야만 열립니다.

로그인 없이 분석 결과를 열람할 수 있는 **공개 공유**를 위해 아래 백엔드가 필요합니다.

> 공유 기능 중 백엔드가 필요한 것은 이 "공개 공유" 뿐입니다. 나머지(링크복사/소셜)는
> 프론트에서 처리합니다.

## 작업 내용

- [ ] 공유 토큰 테이블 `submission_shares` 추가 (alembic)
- [ ] 공유 링크 생성/폐기 엔드포인트 (소유자, 로그인 필요)
- [ ] **비인증** 공개 조회 엔드포인트 (토큰으로 분석 결과 열람)
- [ ] 공개 응답에서 개인정보·원문 등 민감 필드 제외

## 주요 변경 사항

### 1. 데이터 모델 — 새 테이블 `submission_shares`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `share_id` | UUID PK | `default uuid4` |
| `submission_id` | UUID FK → `submissions.submission_id` (`ON DELETE CASCADE`) | not null |
| `token` | `String` unique, index | `secrets.token_urlsafe(32)` — **추측 불가능**해야 함 |
| `created_at` | `timestamptz` | `server_default now()` |
| `revoked_at` | `timestamptz` | nullable — 폐기 시각 |

- 한 submission당 활성 토큰은 1개로 유지(재생성 시 이전 토큰 폐기) 또는 여러 개 허용
  — 편한 쪽으로. 프론트는 "현재 공유 URL 1개"만 필요합니다.
- (선택) `expires_at`을 두어 만료 링크를 지원해도 됩니다. 지금은 없어도 됩니다.

### 2. 엔드포인트

**공유 링크 생성 / 폐기 — 로그인 필요(소유자)**
```
POST   /api/submissions/{id}/share   -> { token, url }   # 없으면 생성, 있으면 기존 것 반환
DELETE /api/submissions/{id}/share   -> 204              # 폐기(revoked_at 기록)
```
- `owned_submission`으로 소유권 검증.
- 분석이 `done` 상태일 때만 생성 허용(결과가 없으면 공유할 것이 없음).
- `url`은 프론트 공개 라우트로 조립: `{FRONTEND_ORIGIN}/shared/{token}` (또는 token만
  주면 프론트가 조립).

**공개 조회 — 비인증(로그인 불필요)**
```
GET /api/shared/{token}   -> ApiResponse[SharedAnalysis]
```
- 토큰이 없거나 폐기(`revoked_at`)됐으면 404.
- rate limit 권장(토큰 대입 방지). `/story`처럼 IP 기준 상한.

### 3. 공개 응답에서 제외할 필드 (중요)

`SharedAnalysis`는 **분석 결과 열람에 필요한 최소 정보만** 담습니다. 아래는 절대
내보내지 않습니다:

- `user_id`, 소유자 이메일·닉네임 등 **개인정보 일체**
- `pdf_bytes` (원문 PDF)
- 내부 식별자 중 불필요한 것 (`submission_id`도 굳이 노출 안 함)

포함: 논문 `title` · `abstract` · `field` · 분석 `report`(기존 AnalysisResponse의
report 구조) 정도.

> report를 화면에 옮길 때 주의점(confidence weak 경고 등)은 `docs/DEVELOPMENT.md §6`
> 과 동일하게 공개 뷰에도 적용돼야 합니다 — 프론트가 처리.

## 확인 사항

- [ ] `submission_shares` 마이그레이션 정상 적용
- [ ] 토큰이 `secrets.token_urlsafe` 등으로 **추측 불가능**하게 생성되는지
- [ ] `POST/DELETE .../share` 소유자만 가능, 타 사용자 403
- [ ] `done` 상태가 아닌 분석은 공유 생성 거부
- [ ] `GET /api/shared/{token}` **로그인 없이** 열람되고, 폐기 후 404
- [ ] 공개 응답에 개인정보·`pdf_bytes` 등 민감 필드가 **포함되지 않는지**
- [ ] 토큰 대입에 대한 rate limit 적용

---

_프론트 후속(별도): 비로그인 공개 뷰 라우트 `/shared/{token}` 추가 후, ShareDialog가
공유 URL을 이 경로로 바꿉니다. 백엔드 준비되면 맞추겠습니다._
