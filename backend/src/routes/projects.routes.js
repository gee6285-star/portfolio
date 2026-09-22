// ============================================================
// 프로젝트 관련 라우트 (URL과 처리 함수 연결만 담당)
// 실제 데이터 처리는 projects.service.js 에 위임합니다.
// ============================================================
const express = require('express');
const router = express.Router();
const { getAllProjects, getProjectById } = require('../services/projects.service');

// GET /api/projects — 전체 프로젝트 목록
router.get('/', async (req, res, next) => {
  try {
    const projects = await getAllProjects();
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id — 프로젝트 상세 하나
router.get('/:id', async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
