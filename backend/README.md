# 백엔드 서버

임성아 포트폴리오 사이트의 백엔드 API 서버입니다. **아직 DB에 연결되어 있지 않고**, 파일 기반 저장소(`src/data/projects.json`)로 동작합니다.

## 실행 방법

```bash
cd backend
npm install
npm start
```

정상 실행되면 `http://localhost:4000/health` 에서 `{"status":"ok"}` 를 확인할 수 있습니다.

포트나 프론트엔드 주소를 바꾸고 싶으면 `.env.example`을 복사해 `.env`로 만들고 값을 수정하세요.

## 관리자 로그인 설정 (최초 1회 필수)

관리자 페이지(`frontend/admin.html`)에 로그인하려면 비밀번호를 직접 정해서 해시로 변환해야 합니다. **비밀번호 원문은 서버 어디에도 저장되지 않고, 해시값만 `.env`에 저장**됩니다.

```bash
cd backend
npm run hash-password -- <원하는 비밀번호>
```

출력된 해시값을 `backend/.env`의 `ADMIN_PASSWORD_HASH=` 뒤에 붙여넣고, `JWT_SECRET=`에는 아무 긴 무작위 문자열을 채우세요. (`.env`는 git에 올라가지 않습니다.)

비밀번호를 잊어버렸을 때도 같은 방법으로 새 해시를 만들어서 덮어쓰면 됩니다 (복구가 아니라 재설정 — bcrypt 해시는 원래 값으로 되돌릴 수 없어서, 잊어버리면 새로 정하는 것 외엔 방법이 없습니다). `.env`를 바꾼 뒤에는 서버를 재시작해야 반영됩니다.

### 로그인 세션 정책 (보안)

- 로그인 쿠키는 **세션 쿠키**입니다 (만료 시간을 지정하지 않음) → 브라우저를 완전히 종료하면 자동으로 사라집니다.
- `frontend/admin.html`은 페이지를 열 때마다(새 탭/새 창 포함) **기존 로그인 쿠키를 무조건 지우고** 로그인 화면부터 보여줍니다. 즉 브라우저를 안 껐어도 관리자 페이지를 다시 열면 항상 비밀번호를 새로 입력해야 합니다.
- 비밀번호 원문은 브라우저에도, 서버에도 저장되지 않습니다 (bcrypt 해시만 `.env`에 저장). 로그인 입력창은 `autocomplete="off"`로 설정해 브라우저가 비밀번호를 기억/자동완성하지 않도록 했습니다 (단, 이는 브라우저 설정에 따라 완전히 보장되지는 않습니다 — 브라우저 자체의 "비밀번호 저장" 기능을 껐다면 더 확실합니다).

## 폴더 구조

```
backend/
├─ app.js                             # Express 앱 조립 (미들웨어, 라우트 연결) - 서버 실행은 안 함
├─ server.js                          # 로컬 개발용 진입점 (app.js를 가져와서 listen)
├─ scripts/hash-password.js           # 관리자 비밀번호 해시 생성 도구
├─ src/
│  ├─ routes/
│  │  ├─ projects.routes.js           # 공개용 (published만)
│  │  └─ admin.routes.js              # 관리자 전용 (로그인 + CRUD, 로그인 필요)
│  ├─ middleware/
│  │  ├─ requireAdmin.js              # 로그인(쿠키) 확인 미들웨어
│  │  └─ loginRateLimit.js            # 로그인 시도 횟수 제한
│  ├─ services/
│  │  ├─ projects.service.js          # 데이터 처리 로직 + 저장 검증 (DB 교체 지점)
│  │  ├─ auth.service.js              # 비밀번호 검증, 로그인 토큰 발급/검증
│  │  └─ duplicateCheck.js            # 제목 기준 중복 확인
│  └─ data/
│     ├─ projects.json                # 실제 데이터 (로컬/배포 초기값. 배포 시 Blob 연결 전까지 사용)
│     └─ projectsStore.js             # 데이터 읽기/쓰기 (로컬=파일, 배포=Vercel Blob 자동 전환. DB 교체 지점)
└─ .env.example                       # 환경변수 예시 (PORT, 관리자 로그인, DB 접속정보 등)

(저장소 루트)
├─ api/index.js                       # Vercel 서버리스 함수 진입점 (backend/app.js를 그대로 감쌈)
├─ vercel.json                        # 배포 라우팅 설정 (frontend/, api/ 경로 연결)
```

## API

### 공개 (인증 불필요)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 서버 상태 확인 |
| GET | `/api/projects` | **공개(published)** 상태인 프로젝트 목록 |
| GET | `/api/projects/:id` | 공개 상태인 프로젝트 상세 하나 |

### 관리자 (로그인 필요 - httpOnly 쿠키 인증)

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/admin/login` | `{ password }` → 로그인 성공 시 세션 쿠키 발급 |
| POST | `/api/admin/logout` | 로그아웃 (쿠키 삭제) |
| GET | `/api/admin/session` | 로그인 상태 확인 |
| GET | `/api/admin/projects` | **초안 포함** 전체 프로젝트 목록 |
| GET | `/api/admin/projects/duplicates` | 제목이 같은 프로젝트끼리 묶은 그룹 목록 (중복 의심) |
| GET | `/api/admin/projects/:id` | 프로젝트 상세 하나 (초안 포함) |
| POST | `/api/admin/projects` | 새 프로젝트 저장 (응답에 `hasDuplicate` 포함 - 저장 직후 같은 제목이 이미 있는지 여부) |
| PUT | `/api/admin/projects/:id` | 프로젝트 수정 (응답에 `hasDuplicate` 포함) |
| DELETE | `/api/admin/projects/:id` | 프로젝트 삭제 (중복 정리 등에 사용) |

### 저장 규칙

- 상태(`status`)는 `draft`(초안) 또는 `published`(공개) 중 하나
- `draft`: 제목만 있어도 저장 가능 (작업 중 임시 저장용)
- `published`: 참고사항(`notes`) 제외한 모든 항목(제목/분야/역할/설명/날짜/참여인원수/링크)이 채워져야 저장됨. 하나라도 비어 있으면 400 에러와 함께 어떤 항목이 비어 있는지 반환.

### 중복 확인 규칙 (`src/services/duplicateCheck.js`)

- **"제목"이 같으면 중복으로 판단**합니다 (앞뒤 공백·대소문자·중간 공백 차이는 무시). 규칙을 단순하게 유지하기 위해 제목 하나만 기준으로 삼습니다.
- 자동으로 지우거나 합치지 않습니다 — `GET /api/admin/projects/duplicates`로 중복 그룹을 보여주고, 관리자가 직접 `frontend/admin.html`에서 비교해서 수정하거나 삭제하도록 안내합니다.
- 새로 저장/수정할 때도 같은 규칙으로 즉시 확인해서, 응답의 `hasDuplicate`가 `true`면 프론트엔드가 저장 성공 메시지에 경고를 덧붙입니다.

## 인증 구조

- 로그인 성공 시 JWT를 발급해 **httpOnly 쿠키**로 내려줍니다 (자바스크립트로 못 읽음 → XSS로부터 보호).
- 이후 모든 관리자 API 요청은 이 쿠키만으로 인증됩니다(비밀번호를 매번 다시 보내지 않음).
- 비밀번호는 bcrypt로 해시된 값만 비교하고, 원문은 어디에도 저장하지 않습니다.

## 나중에 DB를 연결할 때

DB 종류(MySQL / PostgreSQL / MongoDB 등)와 접속 정보가 정해지면 아래 순서로 진행하면 됩니다.

1. `.env`에 DB 접속 정보 채우기 (`.env.example` 참고)
2. DB 클라이언트 패키지 설치 (예: `mysql2`, `pg`, `mongoose` 등)
3. **`src/data/projectsStore.js`(파일 읽기/쓰기)를 DB 쿼리로 교체** — `readAll`, `writeAll`, `nextId`와 같은 역할을 하는 함수로 바꾸기
4. `src/services/projects.service.js`, `src/routes/*.js`, 프론트엔드 코드는 그대로 두어도 됨 (같은 함수 시그니처를 유지하기 때문)

즉, **데이터를 가져오는 방식만 바뀌고 나머지 구조는 그대로 유지되도록** 미리 계층을 나눠 놓았습니다.

## Vercel에 배포하기

이 프로젝트는 프론트엔드(`frontend/`)와 백엔드(`backend/`)를 **같은 Vercel 프로젝트에서 한 번에** 배포하도록 구성돼 있습니다.

- `frontend/`의 정적 파일은 `vercel.json`의 `rewrites`로 루트 주소(`/`, `/admin` 등)에 연결됩니다.
- `backend/app.js`(Express 앱)는 `api/index.js`가 그대로 감싸서, `/api/...`로 오는 모든 요청을 서버리스 함수로 처리합니다. `backend/`의 라우트·서비스 코드는 로컬/배포 어디서든 동일하게 동작합니다.
- 로그인 세션(JWT 쿠키)은 그대로 잘 동작합니다 (서버리스 함수도 쿠키를 읽고 쓸 수 있음).

### ⚠️ 배포 후 반드시 해야 하는 것: Blob 스토리지 연결

Vercel 서버리스 함수는 배포된 파일에 새로 쓰기를 할 수 없습니다(읽기 전용). 그래서 지금까지 쓰던 "파일에 저장" 방식이 배포 환경에서는 그대로 동작하지 않습니다. 대신 **Vercel Blob**(Vercel에서 제공하는 파일 저장소, Hobby 플랜에 무료 사용량 포함)을 연결하면 코드 수정 없이 자동으로 그쪽에 저장하도록 이미 만들어 놨습니다 (`src/data/projectsStore.js` 참고).

**연결 방법 (최초 1회, Vercel 대시보드에서):**

1. Vercel 프로젝트 페이지 → 상단 **Storage** 탭
2. **Create Database** → **Blob** 선택 → 이름 정하고 생성
3. 생성된 Blob 스토리지를 **이 프로젝트에 Connect**(연결) — 연결하면 `BLOB_READ_WRITE_TOKEN` 환경변수가 프로젝트에 자동으로 추가됩니다 (직접 복사/붙여넣기 안 해도 됨)
4. 연결 후 **재배포(Redeploy)** 한 번 필요 (환경변수는 재배포해야 함수에 반영됨)

연결하기 전까지는 배포 시점에 담겨있던 기본 데이터(`projects.json`)는 "조회"는 되지만, 관리자 페이지에서 새로 저장/수정/삭제한 내용은 저장되지 않고 오류 메시지가 뜹니다 (배포된 파일은 읽기 전용이라서). Blob을 연결하면 이 문제가 해결됩니다.

### 로컬 개발에는 영향 없음

로컬(`npm run dev`)에서는 `BLOB_READ_WRITE_TOKEN`이 없으므로 지금처럼 `backend/src/data/projects.json` 파일에 그대로 저장됩니다. 아무 설정도 바꿀 필요 없습니다.

### 알려진 한계

- 로그인 시도 횟수 제한(`loginRateLimit.js`)은 메모리에 기록하는 방식이라, 서버리스 함수가 새로 뜨면(콜드 스타트) 초기화될 수 있습니다. 개인용 사이트 규모에서는 큰 문제가 되지 않지만, 완벽한 방어는 아닙니다.
