// ============================================================
// 관리자 전용 라우트 (로그인 + 프로젝트 관리)
// /login, /logout, /session을 제외한 나머지는 모두 로그인이 필요합니다.
// ============================================================
const express = require('express');
const router = express.Router();

const { verifyPassword, issueToken } = require('../services/auth.service');
const requireAdmin = require('../middleware/requireAdmin');
const { loginRateLimit, recordFailedAttempt, resetAttempts } = require('../middleware/loginRateLimit');
const {
  getAllProjectsForAdmin,
  getProjectByIdForAdmin,
  createProject,
  updateProject,
  deleteProject,
  getDuplicateGroups
} = require('../services/projects.service');

const COOKIE_OPTIONS = {
  httpOnly: true,               // JS(document.cookie)로 못 읽음 - XSS로부터 토큰 보호
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
  // maxAge를 일부러 지정하지 않음 -> "세션 쿠키"가 되어 브라우저를 완전히 종료하면
  // 자동으로 삭제됨 (창을 닫아도 로그인 기록이 남지 않길 원한다는 요청에 따름).
  // 참고: 프론트엔드(admin.html)도 페이지를 열 때마다 로그아웃부터 시키므로,
  // 브라우저를 안 껐어도 admin.html을 다시 열면 항상 비밀번호를 새로 입력해야 함.
};

// POST /api/admin/login (같은 IP에서 15분 안에 5번 틀리면 잠시 막음 - 무작위 대입 방지)
router.post('/login', loginRateLimit, async (req, res, next) => {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력하세요.' });
    }
    const ok = await verifyPassword(password);
    if (!ok) {
      recordFailedAttempt(req);
      return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
    }
    resetAttempts(req);
    const token = issueToken();
    res.cookie('admin_token', token, COOKIE_OPTIONS);
    res.json({ message: '로그인 성공' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ message: '로그아웃 완료' });
});

// GET /api/admin/session - 로그인 상태 확인 (관리자 페이지 진입 시 확인용)
router.get('/session', requireAdmin, (req, res) => {
  res.json({ loggedIn: true });
});

// ---- 아래 경로부터는 로그인 필요 ----
router.use(requireAdmin);

// GET /api/admin/projects - 초안 포함 전체 목록
router.get('/projects', async (req, res, next) => {
  try {
    res.json(await getAllProjectsForAdmin());
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/projects/duplicates - 제목이 겹치는 프로젝트 그룹 (반드시 /:id 라우트보다 위에 있어야 함)
router.get('/projects/duplicates', async (req, res, next) => {
  try {
    res.json(await getDuplicateGroups());
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/projects/:id
router.get('/projects/:id', async (req, res, next) => {
  try {
    const project = await getProjectByIdForAdmin(req.params.id);
    if (!project) return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/projects - 새로 저장
router.post('/projects', async (req, res, next) => {
  try {
    const project = await createProject(req.body || {});
    res.status(201).json(project);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message, fields: err.fields });
    next(err);
  }
});

// PUT /api/admin/projects/:id - 수정
router.put('/projects/:id', async (req, res, next) => {
  try {
    const project = await updateProject(req.params.id, req.body || {});
    if (!project) return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    res.json(project);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message, fields: err.fields });
    next(err);
  }
});

// DELETE /api/admin/projects/:id - 삭제 (중복 정리 등에 사용)
router.delete('/projects/:id', async (req, res, next) => {
  try {
    const deleted = await deleteProject(req.params.id);
    if (!deleted) return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    res.json({ message: '삭제 완료' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
