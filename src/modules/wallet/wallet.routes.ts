import { Router } from "express";
import { fundWallet, getWalletBalance, sendMoneyController, withdrawFromWallet } from "./wallet.controller.ts";
import { protect } from "../../middlewares/auth.ts";
import { validate } from "../../middlewares/validate.ts";
import { fundWalletBodySchema, sendMoneyBodySchema } from "./wallet.validation.ts";

const router = Router();

router.post("/send", protect, validate(sendMoneyBodySchema), sendMoneyController);
router.get("/:user_id", protect, getWalletBalance);
router.post("/:user_id", protect, validate(fundWalletBodySchema), fundWallet);
router.post("/:user_id/withdraw", protect, validate(fundWalletBodySchema), withdrawFromWallet);

export default router;