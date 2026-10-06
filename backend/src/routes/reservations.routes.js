// ============================================================
// 방문 예약 접수 (누구나 사용 가능, 조회는 관리자 라우트에서만)
// POST /api/reservations
// ============================================================
const express = require('express');
const router = express.Router();
const { validateReservation, createReservation } = require('../services/reservations.service');

// 스팸 방지용 간단한 제한: 같은 IP에서 1시간에 10건까지 (메모리 기반이라 재시작 시 초기화됨)
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const attempts = new Map();

function rateLimit(req, res, next) {
  const now = Date.now();
  const recent = (attempts.get(req.ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    return res.status(429).json({ message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' });
  }
  recent.push(now);
  attempts.set(req.ip, recent);
  next();
}

router.post('/', rateLimit, (req, res, next) => {
  try {
    const errors = validateReservation(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(' '), errors });
    }
    const saved = createReservation(req.body);
    res.status(201).json({ id: saved.id, message: '예약 요청이 접수되었습니다.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
