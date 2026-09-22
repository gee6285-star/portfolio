// ============================================================
// 프로젝트 데이터 저장소 (파일 기반 - DB 미연결 상태의 임시 구현)
//
// projects.json 파일을 그대로 읽고 쓰는 가장 낮은 계층입니다.
// 실제 DB가 연결되면 이 파일만 DB 클라이언트 호출로 바꾸면 되고,
// 위 계층(projects.service.js)은 그대로 두어도 됩니다.
// ============================================================
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'projects.json');

function readAll() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeAll(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function nextId(list) {
  return list.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

module.exports = { readAll, writeAll, nextId };
