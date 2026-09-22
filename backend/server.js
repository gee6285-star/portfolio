// ============================================================
// 백엔드 서버 진입점
// 지금은 DB 없이 인메모리 데이터(backend/src/data)로 동작합니다.
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const projectsRouter = require('./src/routes/projects.routes');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// 서버가 살아있는지 확인용
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/projects', projectsRouter);

// 처리되지 않은 오류를 잡아서 500으로 응답 (서버가 죽지 않도록)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`백엔드 서버 실행 중: http://localhost:${PORT}`);
});
