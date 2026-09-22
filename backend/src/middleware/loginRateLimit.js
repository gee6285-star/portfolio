// ============================================================
// 로그인 시도 횟수 제한 (무작위 대입 공격 방지)
//
// 메모리에만 기록하는 단순한 방식입니다 (서버를 재시작하면 초기화됨).
// 같은 IP에서 15분 안에 5번 틀리면 잠시 막습니다.
// ============================================================
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15분

const attempts = new Map(); // ip -> { count, firstAttemptAt }

function loginRateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const record = attempts.get(ip);

  if (record && now - record.firstAttemptAt < WINDOW_MS && record.count >= MAX_ATTEMPTS) {
    const waitMinutes = Math.ceil((WINDOW_MS - (now - record.firstAttemptAt)) / 60000);
    return res.status(429).json({ message: `로그인 시도가 너무 많습니다. ${waitMinutes}분 후 다시 시도하세요.` });
  }
  next();
}

// 비밀번호를 틀렸을 때 호출 - 시도 횟수를 늘림
function recordFailedAttempt(req) {
  const ip = req.ip;
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.firstAttemptAt >= WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    record.count += 1;
  }
}

// 로그인에 성공했을 때 호출 - 그동안의 실패 기록을 지움
function resetAttempts(req) {
  attempts.delete(req.ip);
}

module.exports = { loginRateLimit, recordFailedAttempt, resetAttempts };
