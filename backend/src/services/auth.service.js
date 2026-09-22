// ============================================================
// 관리자 로그인 인증 서비스
//
// 비밀번호 원문은 서버에 저장하지 않습니다. .env의 ADMIN_PASSWORD_HASH는
// bcrypt로 해시된 값만 저장하고(backend/scripts/hash-password.js로 생성),
// 로그인 시 입력값을 해시와 비교(compare)만 합니다.
// 로그인 성공 시 JWT를 발급해 httpOnly 쿠키로 내려주고, 이후 요청은
// 그 쿠키만으로 인증합니다(비밀번호를 매번 다시 보내지 않음).
// ============================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TOKEN_TTL = '8h';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET이 설정되지 않았습니다. backend/.env를 확인하세요.');
  }
  return secret;
}

async function verifyPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new Error('ADMIN_PASSWORD_HASH가 설정되지 않았습니다. backend/.env를 확인하세요.');
  }
  return bcrypt.compare(String(password), hash);
}

function issueToken() {
  return jwt.sign({ role: 'admin' }, getSecret(), { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

module.exports = { verifyPassword, issueToken, verifyToken };
