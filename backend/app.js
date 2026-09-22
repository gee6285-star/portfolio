// ============================================================
// Express 앱 조립 (미들웨어 + 라우트 연결만 담당, 서버를 실행하지는 않음)
//
// 이 파일을 두 곳에서 재사용합니다:
// - backend/server.js: 로컬 개발용 (`npm run dev`) - app.listen()으로 직접 실행
// - api/index.js: Vercel 배포용 - Express 앱을 서버리스 함수로 그대로 감싸서 실행
//   (요청마다 새 인스턴스가 뜰 수 있어서, app.listen() 없이 앱 자체만 내보냅니다)
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const projectsRouter = require('./src/routes/projects.routes');
const adminRouter = require('./src/routes/admin.routes');

const app = express();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';

// 관리자 로그인은 쿠키를 주고받아야 하므로 origin을 '*'가 아닌 특정 주소로 지정하고
// credentials(쿠키 전송)를 허용합니다. (배포 환경에서는 프론트엔드와 같은 도메인에서
// 호출하므로 브라우저가 애초에 CORS 검사를 하지 않지만, 로컬 개발(포트가 다름)에는 필요합니다.)
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
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
