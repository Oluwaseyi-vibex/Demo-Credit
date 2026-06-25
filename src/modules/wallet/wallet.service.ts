import db from "../../config/db";
import { AppError } from "../../utils/AppError";
import { v4 as uuidv4 } from "uuid";
import {
  createIdempotentRecord,
  getIdempotentResponse,
} from "../idempotency/idempotency.service";

export async function createWallet(userId: string) {
  const existingWallet = await db("wallets").where({ user_id: userId }).first();

  if (existingWallet) {
    throw new AppError("Wallet already exists", 409);
  }

  const walletId = uuidv4();

  await db("wallets").insert({
    id: walletId,
    user_id: userId,
  });

  const wallet = await db("wallets").where({ id: walletId }).first();

  return wallet;
}

export async function getWallet(userId: string) {
  console.log("userid", userId);
  const wallet = await db("wallets").where({ user_id: userId }).first();

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  return wallet;
}

export async function fundWallet(
  userId: string,
  amount: number,
  idempotencyKey: string,
  description?: string,
) {
  if (amount <= 0) {
    throw new AppError("Amount must be positive", 400);
  }

  return db.transaction(async (trx) => {
    const existingResponse = await getIdempotentResponse(
      trx,
      idempotencyKey,
      userId,
      "FUND_WALLET",
    );
    if (existingResponse) {
      return existingResponse;
    }

    const [wallet] = await trx("wallets")
      .where({ user_id: userId })
      .select("id")
      .forUpdate();

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    await trx("wallets").where({ id: wallet.id }).increment("balance", amount);

    const transactionId = uuidv4();
    const reference = `FUND-${uuidv4()}`;
    await trx("transactions").insert({
      id: transactionId,
      wallet_id: wallet.id,
      type: "FUND",
      amount,
      status: "SUCCESS",
      reference,
      description: description || "Wallet funded",
    });

    const transaction = await trx("transactions")
      .where({ id: transactionId })
      .first();

    console.log("transaction", transaction);

    return createIdempotentRecord(
      trx,
      idempotencyKey,
      userId,
      "FUND_WALLET",
      transaction,
    );
  });
}

export async function withdrawFromWallet(
  userId: string,
  amount: number,
  idempotencyKey: string,
  description?: string,
) {
  if (amount <= 0) {
    throw new AppError("Amount must be positive", 400);
  }

  return db.transaction(async (trx) => {
    const existingResponse = await getIdempotentResponse(
      trx,
      idempotencyKey,
      userId,
      "WITHDRAW_WALLET",
    );
    if (existingResponse) {
      return existingResponse;
    }

    const [wallet] = await trx("wallets")
      .where({ user_id: userId })
      .select("id", "balance")
      .forUpdate();

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }
    if (wallet.balance < amount) {
      throw new AppError("Insufficient balance", 400);
    }

    await trx("wallets").where({ id: wallet.id }).decrement("balance", amount);

    const transactionId = uuidv4();
    const reference = `WDR-${uuidv4()}`;
    await trx("transactions").insert({
      id: transactionId,
      wallet_id: wallet.id,
      type: "WITHDRAW",
      amount: -amount,
      status: "SUCCESS",
      reference,
      description: description || "Wallet withdrawal",
    });

    const transaction = await trx("transactions")
      .where({ id: transactionId })
      .first();

    return createIdempotentRecord(
      trx,
      idempotencyKey,
      userId,
      "WITHDRAW_WALLET",
      transaction,
    );
  });
}

export async function sendMoney(
  senderId: string,
  senderEmail: string,
  receiverEmail: string,
  amount: number,
  idempotencyKey: string,
  description?: string,
) {
  if (amount <= 0) {
    throw new AppError("Amount must be greater than zero", 400);
  }

  if (senderEmail === receiverEmail) {
    throw new AppError("Sender and receiver cannot be the same", 400);
  }

  return db.transaction(async (trx) => {
    const existingResponse = await getIdempotentResponse(
      trx,
      idempotencyKey,
      senderId,
      "SEND_MONEY",
    );
    if (existingResponse) {
      return existingResponse;
    }

    // Find sender
    const sender = await trx("users").where({ id: senderId }).first();

    console.log("sender", sender);
    if (!sender) {
      throw new AppError("Sender not found", 404);
    }

    // Find receiver
    const receiver = await trx("users").where({ email: receiverEmail }).first();

    console.log("receiver", receiver);
    if (!receiver) {
      throw new AppError("Receiver not found", 404);
    }

    // sender wallet
    const senderWallet = await trx("wallets")
      .where({ user_id: senderId })
      .select("id", "balance")
      .forUpdate()
      .first();

    console.log("senderWallet", senderWallet);
    if (!senderWallet) {
      throw new AppError("Sender wallet not found", 404);
    }

    // receiver wallet
    const receiverWallet = await trx("wallets")
      .where({ user_id: receiver.id })
      .select("id", "balance")
      .forUpdate()
      .first();

    console.log("receiverWallet", receiverWallet);
    if (!receiverWallet) {
      throw new AppError("Receiver wallet not found", 404);
    }

    const senderBalance = Number(senderWallet.balance);

    if (senderBalance < amount) {
      throw new AppError("Insufficient balance", 400);
    }

    const reference = `TRF-${uuidv4()}`;

    // Debit sender
    await trx("wallets")
      .where({ id: senderWallet.id })
      .decrement("balance", amount);

    // Credit receiver
    await trx("wallets")
      .where({ id: receiverWallet.id })
      .increment("balance", amount);

    // Create transfer record
    const transferId = uuidv4();

    await trx("transfers").insert({
      id: transferId,
      sender_wallet_id: senderWallet.id,
      receiver_wallet_id: receiverWallet.id,
      amount,
      reference,
    });

    const transfer = await trx("transfers").where({ id: transferId }).first();

    const senderTransactionId = uuidv4();
    // Sender transaction
    await trx("transactions").insert({
      id: senderTransactionId,
      wallet_id: senderWallet.id,
      type: "TRANSFER_OUT",
      amount,
      status: "SUCCESS",
      reference,
      description: description || `Transfer to ${receiverEmail}`,
    });

    const receiverTransactionId = uuidv4();
    // Receiver transaction
    await trx("transactions").insert({
      id: receiverTransactionId,
      wallet_id: receiverWallet.id,
      type: "TRANSFER_IN",
      amount,
      status: "SUCCESS",
      reference,
      description: description || `Transfer from ${senderEmail}`,
    });

    const response = {
      transfer,
      reference,
      sender: senderEmail,
      receiver: receiverEmail,
      amount,
    };

    return createIdempotentRecord(
      trx,
      idempotencyKey,
      senderId,
      "SEND_MONEY",
      response,
    );
  });
}
