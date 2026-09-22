// ============================================================
// 프로젝트 데이터 저장소
//
// 두 가지 방식으로 동작합니다 (환경변수로 자동 판단, 코드 수정 불필요):
//
// 1) 로컬 개발 (BLOB_READ_WRITE_TOKEN 없음)
//    -> backend/src/data/projects.json 파일을 그대로 읽고 씁니다.
//
// 2) Vercel 배포 (Vercel 대시보드에서 Blob 스토리지를 프로젝트에 연결하면
//    BLOB_READ_WRITE_TOKEN이 자동으로 설정됨)
//    -> Vercel Blob에 저장합니다. Vercel 서버리스 함수는 배포된 파일에
//       쓰기를 할 수 없어서(읽기 전용) 파일 방식이 그대로는 동작하지 않기 때문입니다.
//
// 실제 DB가 연결되면 이 파일만 DB 클라이언트 호출로 바꾸면 되고,
// 위 계층(projects.service.js)은 그대로 두어도 됩니다.
// ============================================================
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'projects.json');
const BLOB_KEY = 'projects.json';
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

function nextId(list) {
  return list.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

// ------------------------------------------------------------
// 파일 기반 (로컬 개발용)
// ------------------------------------------------------------
function readAllFromFile() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeAllToFile(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// ------------------------------------------------------------
// Vercel Blob 기반 (배포용)
// ------------------------------------------------------------
async function readAllFromBlob() {
  const { list } = require('@vercel/blob');
  const { blobs } = await list({ prefix: BLOB_KEY });
  const match = blobs.find((b) => b.pathname === BLOB_KEY);

  if (!match) {
    // 아직 한 번도 저장한 적이 없으면, 배포 시점에 담겨있던 기본 데이터로 시작합니다.
    return readAllFromFile();
  }

  const res = await fetch(match.url, { cache: 'no-store' });
  return res.json();
}

async function writeAllToBlob(list) {
  const { put } = require('@vercel/blob');
  await put(BLOB_KEY, JSON.stringify(list, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

// ------------------------------------------------------------
// 외부에 공개하는 함수 (호출부는 로컬/배포 여부를 몰라도 됨)
// ------------------------------------------------------------
async function readAll() {
  return USE_BLOB ? readAllFromBlob() : readAllFromFile();
}

async function writeAll(list) {
  if (USE_BLOB) {
    await writeAllToBlob(list);
    return;
  }
  try {
    writeAllToFile(list);
  } catch (err) {
    // Vercel에 배포됐는데 Blob 연결을 아직 안 했다면 파일 쓰기가 실패합니다(배포본은 읽기 전용).
    const helpfulError = new Error(
      '데이터를 저장할 수 없습니다. 배포 환경이라면 Vercel 프로젝트에 Blob 스토리지를 연결해야 합니다 (backend/README.md 참고).'
    );
    helpfulError.status = 500;
    throw helpfulError;
  }
}

module.exports = { readAll, writeAll, nextId };
