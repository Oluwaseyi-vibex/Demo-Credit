import { Router } from "express";
import { login, register } from "./auth.controller.ts";
import { loginSchema, registerSchema } from "./auth.validation.ts";
import { validate } from "../../middlewares/validate.ts";


const router = Router();

router.post("/register", validate(registerSchema), register)
router.post("/login", validate(loginSchema), login)

export default router;