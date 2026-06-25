// import { Request, Response, NextFunction } from "express";
// import { getWallet, fundWallet as fundWalletService, withdrawFromWallet as withdrawFromWalletService, sendMoney } from "./wallet.service.ts";

// export async function getWalletBalance(req: Request, res: Response, next: NextFunction) {
//     const { user_id } = req.params;
//     const wallet = await getWallet(user_id as string);
//     res.status(200).json({
//         success: true,
//         wallet,
//     });
// }

// export async function fundWallet(req: Request, res: Response, next: NextFunction) {
//     const { user_id } = req.params;
//     const { amount } = req.body;
//     const wallet = await fundWalletService(user_id as string, amount as number,);
//     res.status(200).json({
//         success: true,
//         wallet,
//     });
// }

// export async function withdrawFromWallet(req: Request, res: Response, next: NextFunction) {
//     const { user_id } = req.params;
//     const { amount } = req.body;
//     const wallet = await withdrawFromWalletService(user_id as string, amount as number);
//     res.status(200).json({
//         success: true,
//         wallet,
//     });
// }

// export async function sendMoneyController(req: Request, res: Response, next: NextFunction) {
//     const { receiverEmail, amount, description } = req.body;
//     console.log("hellow", req.user);
//     const senderId = req.user?.user_id;
//     const senderEmail = req.user?.email;
//     const wallet = await sendMoney(senderId as string, senderEmail as string, receiverEmail as string, amount as number, description);
//     res.status(200).json({
//         success: true,
//         wallet,
//     });
// }

import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/AppError";
import {
  getWallet,
  fundWallet as fundWalletService,
  withdrawFromWallet as withdrawFromWalletService,
  sendMoney,
} from "./wallet.service";

export async function getWalletBalance(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user_id } = req.params;
    const wallet = await getWallet(user_id as string);
    res.status(200).json({
      success: true,
      wallet,
    });
  } catch (error) {
    next(error);
  }
}

export async function fundWallet(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user_id } = req.params;
    const { amount, description } = req.body;
    const idempotencyKey = req.header("Idempotency-Key");

    // Validate idempotency key
    if (!idempotencyKey) {
      throw new AppError("Idempotency-Key header is required", 400);
    }

    // Call service with idempotencyKey
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
  } catch (error) {
    next(error);
  }
}

export async function withdrawFromWallet(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user_id } = req.params;
    const { amount, description } = req.body;
    const idempotencyKey = req.header("Idempotency-Key");

    // Validate idempotency key
    if (!idempotencyKey) {
      throw new AppError("Idempotency-Key header is required", 400);
    }

    // Call service with idempotencyKey
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
  } catch (error) {
    next(error);
  }
}

export async function sendMoneyController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { receiverEmail, amount, description } = req.body;
    const senderId = req.user?.user_id;
    const senderEmail = req.user?.email;
    const idempotencyKey = req.header("Idempotency-Key");

    // Validate idempotency key
    if (!idempotencyKey) {
      throw new AppError("Idempotency-Key header is required", 400);
    }

    // Validate sender
    if (!senderId || !senderEmail) {
      throw new AppError("Unauthorized: Sender not authenticated", 401);
    }

    // Call service with idempotencyKey
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
  } catch (error) {
    next(error);
  }
}
