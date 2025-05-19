import express from 'express';
import {
  createSpecialty,
  deleteSpecialty,
  getAllSpecialties,
  getSpecificSpecialty,
  updateSpecialty,
} from '../controllers/specialty.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import userRouter from './user.routes.js';

// router.use('/:categoryId/projects', usersRouter);

const router = express.Router();
router.use('/:specialtyId/users', userRouter);

const upload = createUploader('specialty');
// Public routes
router.get('/', getAllSpecialties);
router.get('/:id', getSpecificSpecialty);

// Protected admin routes
router.use(protectedRoutes, allowTo('admin'));

router.post('/', upload.single('imageCover'), createSpecialty);
router.put('/:id', upload.single('imageCover'), updateSpecialty);
router.delete('/:id', deleteSpecialty);

export default router;
