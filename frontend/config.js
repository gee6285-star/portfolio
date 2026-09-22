// ============================================================
// 백엔드 API 주소 설정 (portfolio_1.html, admin.html이 공통으로 사용)
//
// - 로컬 개발(npm run dev): frontend는 5500번, backend는 4000번 포트로 따로 뜨므로
//   http://localhost:4000 을 명시적으로 가리킵니다.
// - 배포: 프론트엔드(Vercel)와 백엔드(Render)가 서로 다른 도메인이므로,
//   아래 PRODUCTION_API_ORIGIN에 Render가 실제로 배정한 주소를 채워 넣어야 합니다.
//   (Render에서 Web Service를 만들면 "https://서비스이름-xxxx.onrender.com" 형태의
//   주소가 나옵니다 - 그 주소를 아래에 그대로 붙여넣으세요. 마지막에 슬래시(/)는 빼고.)
// ============================================================
(function () {
  var isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  var PRODUCTION_API_ORIGIN = 'https://seonga-portfolio-backend.onrender.com';

  window.API_ORIGIN = isLocalDev ? 'http://localhost:4000' : PRODUCTION_API_ORIGIN;
  window.API_BASE = window.API_ORIGIN + '/api';
})();
