import { LoginBodySchema, RegisterBodySchema } from "./auth.validation.js";
import { AppError } from "../../utils/AppError.js";
import db from "../../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "./auth.types.js";
import axios from "axios";
import { createWallet } from "../wallet/wallet.service.js";
import { v4 as uuidv4 } from "uuid";
import { getWalletByUserId, getUserByEmail } from "../../utils/db-helpers.js";

function generateAuthToken(user: User) {
  const { id, email } = user;
  return jwt.sign(
    {
      user_id: id,
      email,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1d",
    },
  );
}

async function checkKarmaStatus(email: string) {
  try {
    const url = `https://adjutor.lendsqr.com/v2/verification/karma/${email}`;
    const headers = {
      Authorization: `Bearer ${process.env.ADJUTOR_API_KEY}`,
    };

    const res = await axios.get(url, { headers });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError(
        error.response?.data?.message || "Failed to check karma status",
        error.response?.status || 400,
      );
    }
    throw new AppError("Unknown error while checking karma status", 500);
  }
}

export async function registerUser(body: RegisterBodySchema) {
  const { first_name, last_name, email, password } = body;

  const karmaResponse = await checkKarmaStatus(email);

  if (karmaResponse.isBlacklisted) {
    throw new AppError(
      `User is blacklisted. Reason: ${karmaResponse.reason || "No reason provided"}`,
      403,
    );
  }

  const existingUser = await db("users").where({ email }).first();

  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userId = uuidv4();
  await db("users").insert({
    id: userId,
    first_name,
    last_name,
    email,
    password: hashedPassword,
  });

  const user = await db("users").where({ id: userId }).first();

  if (!user) {
    throw new AppError("Failed to create user", 500);
  }

  if (user.id) {
    await createWallet(user.id);
  }

  const safeUser = {
    id: user.id as string,
    email: user.email as string,
    first_name: user.first_name as string,
    last_name: user.last_name as string,
  };

  const token = generateAuthToken(safeUser);

  return { user: safeUser, token };
}

export async function loginUser(body: LoginBodySchema) {
  const { email, password } = body;

  const user = await db("users").where({ email }).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid password", 401);
  }

  const token = generateAuthToken(user);

  return { user, token };
}

export async function getUserById(userId: string) {
  const user = await db("users").where({ id: userId }).first();
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const wallet = await getWalletByUserId(userId);

  return {
    user: {
      id: user.id as string,
      email: user.email as string,
      first_name: user.first_name as string,
      last_name: user.last_name as string,
      wallet_balance: wallet.balance as number,
    },
  };
}
