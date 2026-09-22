// ============================================================
// 프로젝트 데이터 처리 계층 (Service)
//
// 지금은 파일 저장소(projectsStore.js → projects.json)를 읽고 씁니다.
// 실제 DB가 연결되면 이 파일 안의 구현만 DB 쿼리로 바꾸면 되고,
// 라우터(routes)와 프론트엔드는 그대로 두어도 됩니다.
//
// 상태(status)는 'draft'(초안) 또는 'published'(공개) 둘 중 하나입니다.
// - 공개(published): 참고사항(notes)을 제외한 모든 항목이 채워져 있어야 함
// - 초안(draft): 제목만 있어도 저장 가능 (작업 중 임시 저장 용도)
// ============================================================
const store = require('../data/projectsStore');
const { findDuplicateGroups, hasDuplicateTitle } = require('./duplicateCheck');

// 공개 시 반드시 채워야 하는 항목 (참고사항 notes는 제외)
const REQUIRED_FOR_PUBLISH = ['title', 'tag', 'role', 'description', 'date', 'participantCount', 'link'];

function isEmptyValue(field, value) {
  if (field === 'participantCount') {
    return value === undefined || value === null || value === '' || Number.isNaN(Number(value)) || Number(value) <= 0;
  }
  return value === undefined || value === null || String(value).trim() === '';
}

// 저장 전 검증. 문제가 있으면 비어있는 필드명 목록을 반환(빈 배열이면 통과).
function validate(data, status) {
  if (status === 'published') {
    return REQUIRED_FOR_PUBLISH.filter((field) => isEmptyValue(field, data[field]));
  }
  // 초안은 제목만 있으면 저장 가능 (완전히 빈 항목 저장은 막음)
  return isEmptyValue('title', data.title) ? ['title'] : [];
}

function toPublicShape(list) {
  return list.filter((p) => p.status === 'published');
}

// ------------------------------------------------------------
// 공개 사이트용 (published만)
// ------------------------------------------------------------
async function getPublishedProjects() {
  return toPublicShape(await store.readAll());
}

async function getPublishedProjectById(id) {
  const list = await store.readAll();
  const project = list.find((p) => p.id === Number(id));
  return project && project.status === 'published' ? project : null;
}

// ------------------------------------------------------------
// 관리자용 (초안 포함 전체)
// ------------------------------------------------------------
async function getAllProjectsForAdmin() {
  return store.readAll();
}

async function getProjectByIdForAdmin(id) {
  const list = await store.readAll();
  return list.find((p) => p.id === Number(id)) || null;
}

function buildValidationError(fields) {
  const err = new Error('필수 항목이 비어 있습니다: ' + fields.join(', '));
  err.status = 400;
  err.fields = fields;
  return err;
}

async function createProject(data) {
  const status = data.status === 'published' ? 'published' : 'draft';
  const missing = validate(data, status);
  if (missing.length > 0) throw buildValidationError(missing);

  const list = await store.readAll();
  const now = new Date().toISOString();
  const project = {
    id: store.nextId(list),
    title: data.title || '',
    tag: data.tag || '',
    role: data.role || '',
    description: data.description || '',
    date: data.date || '',
    participantCount: data.participantCount ? Number(data.participantCount) : null,
    notes: data.notes || '',
    link: data.link || '',
    status,
    createdAt: now,
    updatedAt: now
  };
  list.push(project);
  await store.writeAll(list);
  // hasDuplicate는 저장되는 값이 아니라, 저장 직후 "혹시 중복일 수 있음"을 알려주기 위한 안내용 정보
  return { ...project, hasDuplicate: hasDuplicateTitle(project, list) };
}

async function updateProject(id, data) {
  const list = await store.readAll();
  const idx = list.findIndex((p) => p.id === Number(id));
  if (idx === -1) return null;

  const status = data.status === 'published' ? 'published' : 'draft';
  const missing = validate(data, status);
  if (missing.length > 0) throw buildValidationError(missing);

  const updated = {
    ...list[idx],
    title: data.title || '',
    tag: data.tag || '',
    role: data.role || '',
    description: data.description || '',
    date: data.date || '',
    participantCount: data.participantCount ? Number(data.participantCount) : null,
    notes: data.notes || '',
    link: data.link || '',
    status,
    updatedAt: new Date().toISOString()
  };
  list[idx] = updated;
  await store.writeAll(list);
  return { ...updated, hasDuplicate: hasDuplicateTitle(updated, list) };
}

async function deleteProject(id) {
  const list = await store.readAll();
  const idx = list.findIndex((p) => p.id === Number(id));
  if (idx === -1) return false;
  list.splice(idx, 1);
  await store.writeAll(list);
  return true;
}

// 제목이 겹치는 프로젝트끼리 묶어서 반환 (관리자 페이지 "중복 의심 프로젝트" 패널용)
async function getDuplicateGroups() {
  return findDuplicateGroups(await store.readAll());
}

module.exports = {
  getPublishedProjects,
  getPublishedProjectById,
  getAllProjectsForAdmin,
  getProjectByIdForAdmin,
  createProject,
  updateProject,
  deleteProject,
  getDuplicateGroups
};
