import { Router } from "express";
import { z } from "zod";
import { applicationController } from "../controllers/applicationController.js";
import { requireAuth, requireRoles } from "../middlewares/authMiddleware.js";
import { uploadResume } from "../middlewares/uploadMiddleware.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

const applicationCreateSchema = z.object({
  body: z.object({
    jobId: z.string().min(1),
    candidateName: z.string().min(2),
    candidateEmail: z.string().email(),
    phone: z.string().optional(),
    resumeUrl: z.string().optional(),
    coverLetter: z.string().optional(),
    status: z.enum(["screening", "interview", "offer", "hired", "rejected"]).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

const applicationListSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
    search: z.string().optional(),
    status: z.enum(["screening", "interview", "offer", "hired", "rejected"]).optional(),
    jobId: z.string().optional()
  }),
  params: z.object({}).optional()
});

const applicationExportSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    search: z.string().optional(),
    status: z.enum(["screening", "interview", "offer", "hired", "rejected"]).optional(),
    jobId: z.string().optional()
  }),
  params: z.object({}).optional()
});

const applicationUpdateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["screening", "interview", "offer", "hired", "rejected"])
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) })
});

const applicationGetByIdSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) })
});

const applicationAddNoteSchema = z.object({
  body: z.object({
    note: z.string().min(2)
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) })
});

const applicationRerunScreeningSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) })
});

router.get("/", requireAuth, requireRoles("admin", "recruiter"), validate(applicationListSchema), applicationController.list);
router.get(
  "/export/excel",
  requireAuth,
  requireRoles("admin", "recruiter"),
  validate(applicationExportSchema),
  applicationController.exportExcel
);
router.get(
  "/:id",
  requireAuth,
  requireRoles("admin", "recruiter"),
  validate(applicationGetByIdSchema),
  applicationController.getById
);
router.post(
  "/public",
  uploadResume.single("resume"),
  validate(applicationCreateSchema),
  applicationController.publicCreate
);
router.post(
  "/",
  requireAuth,
  uploadResume.single("resume"),
  validate(applicationCreateSchema),
  applicationController.create
);
router.patch(
  "/:id/status",
  requireAuth,
  requireRoles("admin", "recruiter"),
  validate(applicationUpdateStatusSchema),
  applicationController.updateStatus
);
router.patch(
  "/:id/notes",
  requireAuth,
  requireRoles("admin", "recruiter"),
  validate(applicationAddNoteSchema),
  applicationController.addNote
);
router.patch(
  "/:id/screening/rerun",
  requireAuth,
  requireRoles("admin", "recruiter"),
  validate(applicationRerunScreeningSchema),
  applicationController.rerunScreening
);

export default router;
