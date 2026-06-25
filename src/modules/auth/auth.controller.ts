import { Request, Response } from "express";
import { getUserById, loginUser, registerUser } from "./auth.service.ts";
import { sendAuthResponse } from "../../utils/auth-helpers.ts";

export async function register(req: Request, res: Response) {
  const { user, token } = await registerUser(req.body);
  return sendAuthResponse(
    res,
    user,
    token,
    201,
    "User registered successfully",
  );
}

export async function login(req: Request, res: Response) {
  const { user, token } = await loginUser(req.body);

  return sendAuthResponse(res, user, token, 200, "User logged in successfully");
}

export async function getUserByIdController(req: Request, res: Response) {
  const { user } = await getUserById(req.params.user_id as string);

  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    user,
  });
}
