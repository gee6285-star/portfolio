# 백엔드 서버

임성아 포트폴리오 사이트의 백엔드 API 서버입니다. **아직 DB에 연결되어 있지 않고**, 인메모리(로컬 배열) 데이터로 동작합니다.

## 실행 방법

```bash
cd backend
npm install
npm start
```

정상 실행되면 `http://localhost:4000/health` 에서 `{"status":"ok"}` 를 확인할 수 있습니다.

포트나 프론트엔드 주소를 바꾸고 싶으면 `.env.example`을 복사해 `.env`로 만들고 값을 수정하세요.

## 폴더 구조

```
backend/
├─ server.js                    # 서버 진입점 (미들웨어, 라우트 연결)
├─ src/
│  ├─ routes/projects.routes.js     # URL ↔ 처리 함수 연결
│  ├─ services/projects.service.js  # 데이터 처리 로직 (DB 교체 지점)
│  └─ data/projects.data.js         # 임시 데이터 (DB 연결 전까지 사용)
└─ .env.example                 # 환경변수 예시 (PORT, DB 접속정보 등)
```

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 서버 상태 확인 |
| GET | `/api/projects` | 프로젝트 전체 목록 |
| GET | `/api/projects/:id` | 프로젝트 상세 하나 |

## 나중에 DB를 연결할 때

DB 종류(MySQL / PostgreSQL / MongoDB 등)와 접속 정보가 정해지면 아래 순서로 진행하면 됩니다.

1. `.env`에 DB 접속 정보 채우기 (`.env.example` 참고)
2. DB 클라이언트 패키지 설치 (예: `mysql2`, `pg`, `mongoose` 등)
3. **`src/services/projects.service.js` 안의 구현만 수정** — `getAllProjects`, `getProjectById` 함수가 로컬 배열 대신 DB를 조회하도록 바꾸기
4. `src/routes/projects.routes.js`, `server.js`, 프론트엔드 코드는 그대로 두어도 됨 (같은 함수 시그니처를 유지하기 때문)

즉, **데이터를 가져오는 방식만 바뀌고 나머지 구조는 그대로 유지되도록** 미리 계층을 나눠 놓았습니다.
