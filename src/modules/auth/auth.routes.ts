import { Router } from "express";
import { getUserByIdController, login, register } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { validate } from "../../middlewares/validate.js";
import { protect } from "../../middlewares/auth.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/:user_id/me", protect, getUserByIdController);
export default router;
