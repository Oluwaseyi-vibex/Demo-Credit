import { Request, Response, NextFunction } from "express";
import { getTransactions, getAllTransfers } from "./transaction.service";

export async function getAllTransactions(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.params;
    const transactions = await getTransactions(user_id as string);
    res.status(200).json({
        success: true,
        transactions,
    });
}

export async function getAllTransfersController(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.params;
    const transfers = await getAllTransfers(user_id as string);
    res.status(200).json({
        success: true,
        transfers,
    });
}