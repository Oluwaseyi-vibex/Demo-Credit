import { Router } from "express";
import { getUserByIdController, login, register } from "./auth.controller.ts";
import { loginSchema, registerSchema } from "./auth.validation.ts";
import { validate } from "../../middlewares/validate.ts";
import { protect } from "../../middlewares/auth.ts";


const router = Router();

router.post("/register", validate(registerSchema), register)
router.post("/login", validate(loginSchema), login)
router.get("/:user_id/me", protect, getUserByIdController);
export default router;