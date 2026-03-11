import { Router } from "express";
import { z } from "zod";
import { userController } from "../controllers/userController.js";
import { requireAuth, requireRoles } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

const userCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["admin", "recruiter", "candidate"]).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

const userListSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
    search: z.string().optional(),
    role: z.enum(["admin", "recruiter", "candidate"]).optional()
  }),
  params: z.object({}).optional()
});

const userUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(["admin", "recruiter", "candidate"]).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) })
});

const userGetByIdSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) })
});

const userDeleteSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) })
});

router.use(requireAuth, requireRoles("admin"));
router.get("/", validate(userListSchema), userController.list);
router.get("/:id", validate(userGetByIdSchema), userController.getById);
router.post("/", validate(userCreateSchema), userController.create);
router.patch("/:id", validate(userUpdateSchema), userController.update);
router.delete("/:id", validate(userDeleteSchema), userController.remove);

export default router;
