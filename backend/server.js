// ============================================================
// 백엔드 서버 진입점
// 지금은 DB 없이 파일 기반 저장(backend/src/data/projects.json)으로 동작합니다.
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const projectsRouter = require('./src/routes/projects.routes');
const adminRouter = require('./src/routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';

// 관리자 로그인은 쿠키를 주고받아야 하므로 origin을 '*'가 아닌 특정 주소로 지정하고
// credentials(쿠키 전송)를 허용합니다.
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
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`백엔드 서버 실행 중: http://localhost:${PORT}`);
});
