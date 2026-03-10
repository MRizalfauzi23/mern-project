import { Router } from "express";
import { z } from "zod";
import { jobController } from "../controllers/jobController.js";
import { requireAuth, requireRoles } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

const screeningConfigSchema = z
  .object({
    passThreshold: z.coerce.number().min(1).max(100).optional(),
    reviewThreshold: z.coerce.number().min(0).max(99).optional(),
    resumeWeight: z.coerce.number().min(0).max(100).optional(),
    coverLetterWeight: z.coerce.number().min(0).max(100).optional(),
    phoneWeight: z.coerce.number().min(0).max(100).optional(),
    emailWeight: z.coerce.number().min(0).max(100).optional(),
    keywordWeight: z.coerce.number().min(0).max(100).optional(),
    keywordList: z.array(z.string().min(1)).optional()
  })
  .refine(
    (data) => {
      if (!data) return true;
      const total =
        (data.passThreshold ?? 0) +
        (data.reviewThreshold ?? 0) +
        (data.resumeWeight ?? 0) +
        (data.coverLetterWeight ?? 0) +
        (data.phoneWeight ?? 0) +
        (data.emailWeight ?? 0) +
        (data.keywordWeight ?? 0);
      return total <= 100;
    },
    { message: "Total nilai screening tidak boleh lebih dari 100." }
  )
  .optional();

const jobCreateSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    company: z.string().min(2),
    location: z.string().min(2),
    description: z.string().min(10),
    status: z.enum(["open", "closed"]).optional(),
    screeningConfig: screeningConfigSchema
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

const jobListSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
    search: z.string().optional(),
    status: z.enum(["open", "closed"]).optional()
  }),
  params: z.object({}).optional()
});

const jobUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    company: z.string().min(2).optional(),
    location: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    status: z.enum(["open", "closed"]).optional(),
    screeningConfig: screeningConfigSchema
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) })
});

const jobGetByIdSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) })
});

const jobDeleteSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) })
});

router.get("/", validate(jobListSchema), jobController.list);
router.get("/:id", validate(jobGetByIdSchema), jobController.getById);
router.post(
  "/",
  requireAuth,
  requireRoles("admin", "recruiter"),
  validate(jobCreateSchema),
  jobController.create
);
router.patch("/:id", requireAuth, validate(jobUpdateSchema), jobController.update);
router.delete("/:id", requireAuth, validate(jobDeleteSchema), jobController.remove);

export default router;
