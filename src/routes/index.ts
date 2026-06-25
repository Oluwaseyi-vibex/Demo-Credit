import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import walletRoutes from "../modules/wallet/wallet.routes.js";
import transactionRoutes from "../modules/transactions/transactions.routes.js";
const router = Router();

router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/transactions", transactionRoutes);

export default router;
