import express from 'express';
import { protectedRoutes } from '../controllers/auth.controller.js';
import { getMessage, getUsersForSidebar, sendMessage } from '../controllers/message.Controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
const upload = createUploader('message');

const router = express.Router();

router.get("/users", protectedRoutes, getUsersForSidebar);
router.route("/:id")
  .post(protectedRoutes, upload.single('image'), sendMessage)
  .get(protectedRoutes, getMessage);

export default router;



