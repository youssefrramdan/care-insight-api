import express from 'express';
import {
  createHealthTalk,
  getAllHealthTalks,
  getHealthTalkById,
  updateHealthTalk,
  deleteHealthTalk,
  addComment,
  toggleLike,
} from '../controllers/healthTalk.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const router = express.Router();
const upload = createUploader('healthTalks');

// Public routes (no authentication required)
router.get('/', getAllHealthTalks);
router.get('/:id', getHealthTalkById);

// Protected routes
router.use(protectedRoutes);

// Doctor-only routes
router.post('/', allowTo('doctor'), upload.single('image'), createHealthTalk);

// Protected routes for authenticated users
router.route('/:id').patch(updateHealthTalk).delete(deleteHealthTalk);

// Social interaction routes
router.post('/:id/comments', addComment);
router.post('/:id/like', toggleLike);

export default router;
