// ============================================================
// 관리자 인증 확인 미들웨어
// 쿠키의 admin_token(JWT)이 유효할 때만 다음으로 진행시킵니다.
// ============================================================
const { verifyToken } = require('../services/auth.service');

function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.admin_token;
  const payload = token && verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  next();
}

module.exports = requireAdmin;
