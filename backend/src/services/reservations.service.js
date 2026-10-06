// ============================================================
// 방문 예약 검증 + 저장
// 화면(reservation.html)에서도 같은 규칙으로 먼저 확인하지만,
// 최종 검증은 여기(서버)에서 다시 합니다.
// ============================================================
const store = require('../data/reservationsStore');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 처리 상태: 접수(신청 직후 기본값) / 확정(승인) / 변경 요청(다른 시간 제안) / 취소(방문 원치 않음)
const STATUSES = ['접수', '확정', '변경 요청', '취소'];
const DEFAULT_STATUS = STATUSES[0];
// 같은 날짜+시간에 하나만 예약 가능. "취소"된 예약은 자리를 차지하지 않습니다.
// (접수/확정/변경 요청 상태는 그 시간을 차지한 것으로 봅니다)
const SLOT_HOLDING_STATUSES = ['접수', '확정', '변경 요청'];
const SLOT_TAKEN_MESSAGE = '이미 예약이 완료된 날짜/시간입니다. 다른 시간을 선택해 주세요.';
const NAME_MAX = 50;
const PURPOSE_MAX = 1000;

// 희망 시간: 13:00 ~ 18:00, 30분 단위 (화면의 선택지와 동일)
const ALLOWED_TIMES = [];
for (let minutes = 13 * 60; minutes <= 18 * 60; minutes += 30) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  ALLOWED_TIMES.push(hh + ':' + mm);
}

function todayInKorea() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// 입력값을 검사해서 오류 메시지 배열을 돌려줍니다 (비어 있으면 통과).
function validateReservation(body) {
  const errors = [];
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const purpose = String(body.purpose || '').trim();
  const date = String(body.date || '');
  const time = String(body.time || '');

  if (!name) errors.push('이름을 입력해 주세요.');
  else if (name.length > NAME_MAX) errors.push('이름은 ' + NAME_MAX + '자 이하로 입력해 주세요.');

  if (!EMAIL_PATTERN.test(email)) errors.push('이메일 형식이 올바르지 않습니다.');

  if (!purpose) errors.push('방문 목적을 입력해 주세요.');
  else if (purpose.length > PURPOSE_MAX) errors.push('방문 목적은 ' + PURPOSE_MAX + '자 이하로 입력해 주세요.');

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date + 'T00:00:00Z') : null;
  if (!parsed || isNaN(parsed) || parsed.toISOString().slice(0, 10) !== date) {
    errors.push('방문 날짜가 올바르지 않습니다.');
  } else {
    const weekday = parsed.getUTCDay();
    if (weekday === 0 || weekday === 6) errors.push('평일만 선택할 수 있습니다.');
    if (date <= todayInKorea()) errors.push('내일 이후의 날짜만 선택할 수 있습니다.');
  }

  if (!ALLOWED_TIMES.includes(time)) errors.push('희망 시간이 올바르지 않습니다.');
  if (body.consent !== true) errors.push('개인정보 전달에 동의해 주세요.');

  return errors;
}

function isSlotHeld(r) {
  return SLOT_HOLDING_STATUSES.includes(r.status || DEFAULT_STATUS);
}

// 같은 날짜+시간을 이미 차지한 다른 예약이 있으면 돌려줍니다 (excludeId: 자기 자신은 제외)
function findSlotConflict(list, date, time, excludeId) {
  return list.find((r) => r.id !== excludeId && r.date === date && r.time === time && isSlotHeld(r));
}

function slotTakenError() {
  const err = new Error(SLOT_TAKEN_MESSAGE);
  err.status = 409;
  return err;
}

// 예약 현황: 이미 차지된 날짜/시간만 돌려줍니다 (이름/이메일 등 개인정보는 절대 포함하지 않음)
function getBookedSlots() {
  return store.readAll().filter(isSlotHeld).map((r) => ({ date: r.date, time: r.time }));
}

// ※ 아래 함수들은 await 없이 "읽기 -> 중복 확인 -> 쓰기"가 한 번에 끝나므로(동기 방식),
//   Node.js 서버 한 대에서는 두 요청이 동시에 와도 같은 시간이 중복 저장될 수 없습니다.
function createReservation(body) {
  const list = store.readAll();
  if (findSlotConflict(list, body.date, body.time, null)) throw slotTakenError();
  const reservation = {
    id: list.reduce((max, r) => Math.max(max, r.id), 0) + 1,
    name: String(body.name).trim(),
    email: String(body.email).trim(),
    purpose: String(body.purpose).trim(),
    date: body.date,
    time: body.time,
    consent: true,
    status: DEFAULT_STATUS,
    createdAt: new Date().toISOString()
  };
  list.push(reservation);
  store.writeAll(list);
  return reservation;
}

// 상태 값이 없는 예전 데이터도 "접수"로 보이게 채워서 돌려줍니다.
function getAllReservations() {
  return store.readAll().map((r) => ({ ...r, status: r.status || DEFAULT_STATUS }));
}

// 예약 1건의 처리 상태를 바꿉니다. 없는 예약이면 null.
function updateReservationStatus(id, status) {
  const list = store.readAll();
  const target = list.find((r) => r.id === id);
  if (!target) return null;
  // 취소 -> 다시 접수/확정 등으로 되돌릴 때, 그 사이 다른 사람이 같은 시간을 예약했다면 막습니다.
  if (SLOT_HOLDING_STATUSES.includes(status) && findSlotConflict(list, target.date, target.time, target.id)) {
    const err = new Error('같은 날짜/시간에 이미 다른 예약이 있어 이 상태로 바꿀 수 없습니다.');
    err.status = 409;
    throw err;
  }
  target.status = status;
  target.statusUpdatedAt = new Date().toISOString();
  store.writeAll(list);
  return { ...target };
}

module.exports = {
  STATUSES,
  validateReservation,
  createReservation,
  getAllReservations,
  getBookedSlots,
  updateReservationStatus
};
