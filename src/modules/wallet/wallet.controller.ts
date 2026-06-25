import { Request, Response } from "express";
import {
  getWallet,
  fundWallet as fundWalletService,
  withdrawFromWallet as withdrawFromWalletService,
  sendMoney,
} from "./wallet.service.js";

export async function getWalletBalance(req: Request, res: Response) {
  const { user_id } = req.params;
  const wallet = await getWallet(user_id as string);
  res.status(200).json({
    success: true,
    wallet,
  });
}

export async function fundWallet(req: Request, res: Response) {
  const { user_id } = req.params;
  const { amount, description } = req.body;
  const idempotencyKey = req.idempotencyKey as string;

  const transaction = await fundWalletService(
    user_id as string,
    amount as number,
    idempotencyKey,
    description as string,
  );

  res.status(200).json({
    success: true,
    data: transaction,
  });
}

export async function withdrawFromWallet(req: Request, res: Response) {
  const { user_id } = req.params;
  const { amount, description } = req.body;
  const idempotencyKey = req.idempotencyKey as string;

  const transaction = await withdrawFromWalletService(
    user_id as string,
    amount as number,
    idempotencyKey,
    description as string,
  );

  res.status(200).json({
    success: true,
    data: transaction,
  });
}

export async function sendMoneyController(req: Request, res: Response) {
  const { receiverEmail, amount, description } = req.body;
  const senderId = req.user?.user_id;
  const senderEmail = req.user?.email;
  const idempotencyKey = req.idempotencyKey as string;

  if (!senderId || !senderEmail) {
    throw new Error("Unauthorized: Sender not authenticated");
  }

  const transfer = await sendMoney(
    senderId as string,
    senderEmail as string,
    receiverEmail as string,
    amount as number,
    idempotencyKey,
    description as string,
  );

  res.status(200).json({
    success: true,
    data: transfer,
  });
}
