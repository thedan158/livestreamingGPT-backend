import express from "express";
const router = express.Router();

import { MealController } from "../controllers/meal.controller.js";

router.get("/getMeal/:type", MealController.getAllMeal);



export default router;