import express from 'express';
import {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  uploadUserImage,
  changeMyPassword,
  changeUserPassword,
  updateWorkingHours,
  getAllDoctors,
  createFilterObject,
  uploadMedicalDocuments,
  getMedicalDocuments,
} from '../controllers/user.controller.js';
import { protectedRoutes, allowTo } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  updateMeValidator,
  uploadUserImageValidator,
  changeMyPasswordValidator,
  changeUserPasswordValidator,
} from '../validators/user.validator.js';

const userRouter = express.Router({ mergeParams: true });
const upload = createUploader('users');

// Current logged-in user routes
userRouter.get('/me', protectedRoutes, getMe);
userRouter.patch('/me', protectedRoutes, updateMeValidator, updateMe);
userRouter.patch(
  '/changePassword',
  protectedRoutes,
  changeMyPasswordValidator,
  changeMyPassword
);
userRouter.post(
  '/uploadImage',
  protectedRoutes,
  upload.single('profileImage'),
  uploadUserImageValidator,
  uploadUserImage
);

// Add route for uploading medical documents
userRouter.post(
  '/uploadMedicalDocuments',
  protectedRoutes,
  upload.array('medicalDocuments', 5),
  uploadMedicalDocuments
);

// Add route for getting medical documents
userRouter.get('/getMedicalDocuments', protectedRoutes, getMedicalDocuments);

// Doctor-specific routes
userRouter.patch(
  '/updateWorkingHours',
  protectedRoutes,
  allowTo('doctor'),
  updateWorkingHours
);

// Public route to get all doctors
userRouter.get('/doctors', getAllDoctors);

// Admin-only routes for user management
// userRouter.use(allowTo('admin'));
userRouter
  .route('/')
  .post(createUserValidator, createUser)
  .get(createFilterObject, getAllUsers);

userRouter
  .route('/:id')
  .get(getUserValidator, getUser)
  .put(updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);

userRouter.patch(
  '/changePassword/:id',
  changeUserPasswordValidator,
  changeUserPassword
);

export default userRouter;
