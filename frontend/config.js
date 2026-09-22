// ============================================================
// 백엔드 API 주소 설정 (portfolio_1.html, admin.html이 공통으로 사용)
//
// - 로컬 개발(npm run dev): frontend는 5500번, backend는 4000번 포트로 따로 뜨므로
//   http://localhost:4000 을 명시적으로 가리켜야 합니다.
// - Vercel 배포: 프론트엔드와 백엔드(api/ 서버리스 함수)가 같은 도메인에서 서비스되므로
//   상대경로(/api)만으로 충분합니다. (도메인을 하드코딩하지 않아도 항상 맞게 동작함)
// ============================================================
(function () {
  var isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  window.API_ORIGIN = isLocalDev ? 'http://localhost:4000' : '';
  window.API_BASE = window.API_ORIGIN + '/api';
})();
