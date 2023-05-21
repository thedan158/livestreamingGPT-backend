//#region import package
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUI from "swagger-ui-express";
import { specs } from "./utils/docs.js";
import http, { get } from "http";
import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

//#region initialize server and database
const app = express();
const server = http.createServer(app);
dotenv.config();
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  admin.app();
}

//#region setup middleware
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(cors());
//#endregion

//#region import router
import authRouters from "./routers/auth.router.js";
import reportRouters from "./routers/report.router.js";
import mealRouters from "./routers/meal.router.js";
import doctorRouters from "./routers/doctor.router.js";
//#region setup router

app.use("/api/auth", authRouters);
app.use("/api/report", reportRouters);
app.use("/api/meal", mealRouters);
app.use("/api/doctor", doctorRouters);
//#end region

//#endregion
const port = process.env.PORT || 3001;
server.listen(port, "0.0.0.0", () => {
  console.log(`Server API listening at http://localhost:${port}`);
});
