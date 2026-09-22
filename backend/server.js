// ============================================================
// 로컬 개발용 서버 진입점 (npm run dev / npm start)
// 실제 앱 구성(미들웨어, 라우트)은 backend/app.js에 있습니다.
// Vercel에 배포될 때는 이 파일이 아니라 api/index.js가 사용됩니다.
// ============================================================
const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`백엔드 서버 실행 중: http://localhost:${PORT}`);
});
