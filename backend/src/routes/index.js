import { Router } from "express";
import applicationRoutes from "./applicationRoutes.js";
import authRoutes from "./authRoutes.js";
import jobRoutes from "./jobRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "API is healthy" });
});
router.use("/auth", authRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/users", userRoutes);

export default router;
