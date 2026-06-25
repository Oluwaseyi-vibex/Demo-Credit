import { Router } from "express";
import {
  getAllTransactions,
  getAllTransfersController,
} from "./transaction.controller.js";
import { protect } from "../../middlewares/auth.js";

const router = Router();

router.get("/:user_id", protect, getAllTransactions);
router.get("/:user_id/transfers", protect, getAllTransfersController);

export default router;
