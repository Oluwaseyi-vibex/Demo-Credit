import { Router } from "express";
import { fundWallet, getWalletBalance, withdrawFromWallet } from "./wallet.controller.ts";
import { protect } from "../../middlewares/auth.ts";
import { validate } from "../../middlewares/validate.ts";
import { fundWalletBodySchema } from "./wallet.validation.ts";

const router = Router();

router.get("/:user_id", protect, getWalletBalance);
router.post("/:user_id", protect, validate(fundWalletBodySchema), fundWallet);
router.post("/:user_id/withdraw", protect, validate(fundWalletBodySchema), withdrawFromWallet);

export default router;