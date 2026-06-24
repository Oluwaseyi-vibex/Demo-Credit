import { Request, Response, NextFunction } from "express";
import { getWallet, fundWallet as fundWalletService, withdrawFromWallet as withdrawFromWalletService } from "./wallet.service.ts";

export async function getWalletBalance(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.params;
    const wallet = await getWallet(user_id as string);
    res.status(200).json({
        success: true,
        wallet,
    });
}

export async function fundWallet(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.params;
    const { amount } = req.body;
    const wallet = await fundWalletService(user_id as string, amount as number);
    res.status(200).json({
        success: true,
        wallet,
    });
}

export async function withdrawFromWallet(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.params;
    const { amount } = req.body;
    const wallet = await withdrawFromWalletService(user_id as string, amount as number);
    res.status(200).json({
        success: true,
        wallet,
    });
}