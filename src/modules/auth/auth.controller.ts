
import { Request, Response, NextFunction } from "express";
import { getUserById, loginUser, registerUser } from "./auth.service.ts";
import { User } from "./auth.types.ts";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export async function register(req: Request, res: Response, next: NextFunction) {
    const { user, token } = await registerUser(req.body);

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        user,
        token,
    });
}

export async function login(req: Request, res: Response, next: NextFunction) {
    const { user, token } = await loginUser(req.body);

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
        },
        token,
    });
}

export async function getUserByIdController(req: Request, res: Response, next: NextFunction) {

    const { user } = await getUserById(req.params.user_id as string);

    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        user
    });
}
