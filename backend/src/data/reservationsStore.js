// ============================================================
// 방문 예약 저장소 (파일 방식)
//
// backend/src/data/reservations.json 에 예약 목록을 저장합니다.
// - 이름/이메일 등 개인정보가 들어가므로 이 파일은 git에 올라가지 않습니다(.gitignore).
// - projectsStore와 달리 Vercel Blob(공개 URL)은 일부러 쓰지 않았습니다.
//   개인정보가 공개 주소로 노출될 수 있기 때문입니다.
// - Render 무료 플랜은 디스크가 영구적이지 않아 재배포/재시작 시 초기화될 수 있습니다.
//   저장 방식은 DB가 정해지면 이 파일만 교체하세요.
// ============================================================
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'reservations.json');

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeAll(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

module.exports = { readAll, writeAll };
