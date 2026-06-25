import db from "../config/db.js";
import { AppError } from "./AppError.js";

/**
 * Retrieves a wallet by user ID with proper error handling
 * @param userId - The user's ID
 * @param trx - Optional Knex transaction object
 * @returns The wallet object
 */
export async function getWalletByUserId(userId: string, trx = db) {
  const wallet = await trx("wallets").where({ user_id: userId }).first();

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  return wallet;
}

/**
 * Retrieves a user by ID with proper error handling
 * @param userId - The user's ID
 * @param trx - Optional Knex transaction object
 * @returns The user object
 */
export async function getUserById(userId: string, trx = db) {
  const user = await trx("users").where({ id: userId }).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

/**
 * Retrieves a user by email with proper error handling
 * @param email - The user's email
 * @param trx - Optional Knex transaction object
 * @returns The user object
 */
export async function getUserByEmail(email: string, trx = db) {
  const user = await trx("users").where({ email }).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

/**
 * Validates that an amount is positive
 * @param amount - The amount to validate
 * @param message - Custom error message (optional)
 */
export function validateAmount(
  amount: number,
  message = "Amount must be positive",
) {
  if (amount <= 0) {
    throw new AppError(message, 400);
  }
}
