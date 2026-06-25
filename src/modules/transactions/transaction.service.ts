import db from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

export async function getTransactions(userId: string) {
  const wallet = await db("wallets").where({ user_id: userId }).first();

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  const transactions = await db("transactions")
    .where({ wallet_id: wallet.id })
    .select("*");
  return transactions;
}

export async function getAllTransfers(userId: string) {
  const wallet = await db("wallets").where({ user_id: userId }).first();

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  const transfers = await db("transfers")
    .where({ sender_wallet_id: wallet.id })
    .select("*");
  return transfers;
}
