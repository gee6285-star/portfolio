// ============================================================
// 공개 프로젝트 라우트 (누구나 접근 가능)
// 공개(published) 상태인 프로젝트만 내려줍니다. 초안(draft)은
// backend/src/routes/admin.routes.js 쪽(로그인 필요)에서만 조회 가능합니다.
// ============================================================
const express = require('express');
const router = express.Router();
const { getPublishedProjects, getPublishedProjectById } = require('../services/projects.service');

// GET /api/projects — 공개된 프로젝트 전체 목록
router.get('/', async (req, res, next) => {
  try {
    res.json(await getPublishedProjects());
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id — 공개된 프로젝트 상세 하나
router.get('/:id', async (req, res, next) => {
  try {
    const project = await getPublishedProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
