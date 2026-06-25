import { Router } from "express";
import {
  fundWallet,
  getWalletBalance,
  sendMoneyController,
  withdrawFromWallet,
} from "./wallet.controller.js";
import { protect } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  fundWalletBodySchema,
  sendMoneyBodySchema,
} from "./wallet.validation.js";
import { requireIdempotencyKey } from "../../middlewares/idempotency.js";

const router = Router();

router.post(
  "/send",
  protect,
  requireIdempotencyKey,
  validate(sendMoneyBodySchema),
  sendMoneyController,
);
router.get("/:user_id", protect, getWalletBalance);
router.post(
  "/:user_id",
  protect,
  requireIdempotencyKey,
  validate(fundWalletBodySchema),
  fundWallet,
);
router.post(
  "/:user_id/withdraw",
  protect,
  requireIdempotencyKey,
  validate(fundWalletBodySchema),
  withdrawFromWallet,
);

export default router;
