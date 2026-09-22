// ============================================================
// 프로젝트 중복 확인 (단순 규칙)
//
// "제목"이 사실상 같으면 중복으로 봅니다 (앞뒤 공백, 대소문자, 중간 공백
// 차이만 있는 경우도 같은 제목으로 취급). 규칙을 복잡하게 만들지 않기 위해
// 비교 기준은 제목 하나만 사용합니다.
// ============================================================

// 제목 비교용 정규화: 앞뒤 공백 제거 + 소문자 변환 + 내부 공백 전부 제거
function normalizeTitle(title) {
  return String(title || '').trim().toLowerCase().replace(/\s+/g, '');
}

// 제목이 같은 프로젝트끼리 묶어서 그룹으로 반환 (그룹 크기가 1이면 중복 아님 - 제외)
function findDuplicateGroups(projects) {
  const groupsByTitle = {};
  projects.forEach((project) => {
    const key = normalizeTitle(project.title);
    if (!key) return; // 제목이 없는 항목은 비교하지 않음
    if (!groupsByTitle[key]) groupsByTitle[key] = [];
    groupsByTitle[key].push(project);
  });
  return Object.values(groupsByTitle).filter((group) => group.length > 1);
}

// 프로젝트 하나가 자기 자신을 제외한 다른 프로젝트와 제목이 겹치는지 확인
// (새로 저장/수정할 때 "혹시 중복일 수 있음"을 바로 알려주는 용도)
function hasDuplicateTitle(project, allProjects) {
  const key = normalizeTitle(project.title);
  if (!key) return false;
  return allProjects.some((p) => p.id !== project.id && normalizeTitle(p.title) === key);
}

module.exports = { normalizeTitle, findDuplicateGroups, hasDuplicateTitle };
