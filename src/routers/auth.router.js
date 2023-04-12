import express from "express";
const router = express.Router();

import { AuthController } from "../controllers/auth.controller.js";

router.post("/login", AuthController.loginUser);
router.post("/register", AuthController.registerUser);
router.post("/forgotPassword", AuthController.forgotPassword);
router.post("/changePassword", AuthController.changePassword);
router.get("/getUser/:username", AuthController.getUserProfile);
router.post("/searchProfile", AuthController.searchProfile);
router.post('/updateUser/:username', AuthController.updateInfo);



export default router;
