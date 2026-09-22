// ============================================================
// 프로젝트 데이터 접근 계층 (Service)
//
// 지금은 로컬 배열(projects.data.js)을 읽지만, DB가 연결되면
// 이 파일 안의 구현만 DB 쿼리로 바꾸면 됩니다.
// 함수 이름과 반환 형태(Promise)를 유지하면 라우터 쪽은 수정할 필요가 없습니다.
// ============================================================
const PROJECTS = require('../data/projects.data');

// 전체 프로젝트 목록 조회
async function getAllProjects() {
  // TODO: DB 연결 후 예) SELECT * FROM projects ORDER BY id 로 교체
  return PROJECTS;
}

// id로 프로젝트 하나 조회
async function getProjectById(id) {
  // TODO: DB 연결 후 예) SELECT * FROM projects WHERE id = ? 로 교체
  return PROJECTS.find((p) => p.id === Number(id)) || null;
}

module.exports = { getAllProjects, getProjectById };
