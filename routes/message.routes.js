import express from 'express';
import { protectedRoutes } from '../controllers/auth.controller.js';
import { getMessage, getUsersForSidebar, sendMessage } from '../controllers/message.Controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
const upload = createUploader('users');

const router = express.Router();




router.get("/users",protectedRoutes,getUsersForSidebar)   
router.route("/:id").post(protectedRoutes,sendMessage)
.get(protectedRoutes,getMessage)







export default router



