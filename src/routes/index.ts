import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.ts";
import walletRoutes from "../modules/wallet/wallet.routes.ts";
const router = Router();

router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);

export default router;