import { Router } from "express";
import { getAllTransactions, getAllTransfersController } from "./transaction.controller.ts";
import { protect } from "../../middlewares/auth.ts";

const router = Router();

router.get("/:user_id", protect, getAllTransactions);
router.get("/:user_id/transfers", protect, getAllTransfersController);

export default router;