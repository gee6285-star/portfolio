// ============================================================
// Express 앱 조립 (미들웨어 + 라우트 연결만 담당, 서버를 실행하지는 않음)
//
// 이 파일을 두 곳에서 재사용합니다:
// - backend/server.js: 로컬 개발용 (`npm run dev`) - app.listen()으로 직접 실행
// - Render 배포용: server.js가 그대로 실행됨 (app.listen 포함)
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const projectsRouter = require('./src/routes/projects.routes');
const adminRouter = require('./src/routes/admin.routes');

const app = express();

// FRONTEND_ORIGIN은 쉼표(,)로 여러 개 적을 수 있습니다.
// 예: https://portfolio-alpha-flax-0o25vvryhm.vercel.app,https://portfolio-portfolio-42ae.vercel.app
// (Vercel은 프로젝트에 배정하는 도메인이 여러 개일 수 있어서, 실제 방문자가 쓰는 주소를
// 정확히 알기 전까지 헷갈리기 쉽습니다. 하나만 등록해도 되고, 나중에 도메인이 바뀌거나
// 추가되면 이 값에 쉼표로 이어붙이기만 하면 됩니다 - 코드 수정 불필요.)
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || 'http://localhost:5500')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// 관리자 로그인은 쿠키를 주고받아야 하므로 origin을 '*'가 아닌 허용 목록으로 지정하고
// credentials(쿠키 전송)를 허용합니다.
app.use(cors({
  origin: function (origin, callback) {
    // origin이 없는 요청(서버-서버 호출, curl 등)은 그대로 통과시킴
    if (!origin || FRONTEND_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 차단: 허용되지 않은 출처입니다 - ' + origin));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 서버가 살아있는지 확인용
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/projects', projectsRouter);
app.use('/api/admin', adminRouter);

// 처리되지 않은 오류를 잡아서 500으로 응답 (서버가 죽지 않도록)
// err.status가 지정된 경우는 우리가 직접 만든, 사용자에게 보여줘도 안전한 안내
// 메시지입니다 (예: Blob 미연결 안내). 그 외(진짜 예상 못한 오류)는 자세한 내용을
// 감추고 일반 메시지만 응답합니다 (스택트레이스 등 민감한 내부 정보 노출 방지).
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.status ? err.message : '서버 오류가 발생했습니다.';
  res.status(status).json({ message });
});

module.exports = app;
