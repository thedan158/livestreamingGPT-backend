import express from "express";
const router = express.Router();

import { DoctorController } from "../controllers/doctor.controller.js";

router.get("/getPatientMessages/:username", DoctorController.getPatientMessages);
router.get("/getAllDoctors", DoctorController.getAllDoctor);
router.get("/getAllMedicine/:type", DoctorController.getAllMedicine);

export default router;