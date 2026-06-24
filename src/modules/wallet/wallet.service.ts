import db from "../../config/db";
import { AppError } from "../../utils/AppError";
import { Wallet } from "./wallet.types";

export async function createWallet(userId: string) {
    console.log("create wallet userid", userId)
    const wallet = await db("wallets").where({ user_id: userId }).first();

    if (wallet) {
        throw new AppError("Wallet already exists", 409);
    }

    return await db("wallets").insert({ user_id: userId }).returning("*") as Wallet[];
}

export async function getWallet(userId: string) {
    console.log("userid", userId)
    const wallet = await db("wallets").where({ user_id: userId }).first();

    if (!wallet) {
        throw new AppError("Wallet not found", 404);
    }

    return wallet;
}

export async function fundWallet(userId: string, amount: number) {
    const wallet = await db("wallets").where({ user_id: userId }).first();

    if (!wallet) {
        throw new AppError("Wallet not found", 404);
    }

    return await db("wallets")
        .where({ user_id: userId })
        .update({
            balance: db.raw("balance + ?", [amount]),
        })
        .returning("*") as Wallet[];
}

export async function withdrawFromWallet(userId: string, amount: number) {
    const wallet = await db("wallets").where({ user_id: userId }).first();

    if (!wallet) {
        throw new AppError("Wallet not found", 404);
    }

    if (wallet.balance < amount) {
        throw new AppError("Insufficient balance", 400);
    }

    return await db("wallets")
        .where({ user_id: userId })
        .update({
            balance: db.raw("balance - ?", [amount]),
        })
        .returning("*") as Wallet[];
}