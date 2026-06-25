import { LoginBodySchema, RegisterBodySchema } from "./auth.validation.ts";
import { AppError } from "../../utils/AppError.ts";
import db from "../../config/db.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "./auth.types.ts";
import axios from "axios";
import { createWallet } from "../wallet/wallet.service.ts";

function generateAuthToken(user: User) {
    const { id, email } = user
    return jwt.sign({
        user_id: id,
        email
    }, process.env.JWT_SECRET as string, {
        expiresIn: "1d"
    })
}

async function checkKarmaStatus(email: string) {
    try {
        const url = `https://adjutor.lendsqr.com/v2/verification/karma/${email}`;
        const headers = {
            Authorization: `Bearer ${process.env.ADJUTOR_API_KEY}`,
        };

        const res = await axios.get(url, { headers });

        console.log(res.data)
        return res.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Karma lookup error:', error.response?.data);
            throw new AppError(
                error.response?.data?.message ||
                'Failed to check karma status',
                error.response?.status || 400
            );
        }
        throw new AppError('Unknown error while checking karma status', 500);
    }
}

export async function registerUser(body: RegisterBodySchema) {
    const { first_name, last_name, email, password } = body;

    const karmaResponse = await checkKarmaStatus(email);

    if (karmaResponse.data) {
        throw new AppError(
            `User is blacklisted. Reason: ${karmaResponse.data.reason || 'No reason provided'}`,
            403
        );
    }


    const existingUser = await db("users").where({ email }).first();

    if (existingUser) {
        throw new AppError("User already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db("users").insert({
        first_name,
        last_name,
        email,
        password: hashedPassword,
    }).returning("*") as User[];

    if (user.id) {
        await createWallet(user.id);
    }
    const token = generateAuthToken(user);


    return { user, token };

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
    console.log("user: ", user);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    const wallet = await db("wallets").where({ user_id: userId }).first();
    console.log("wallet: ", wallet);
    if (!wallet) {
        throw new AppError("Wallet not found", 404);
    }

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