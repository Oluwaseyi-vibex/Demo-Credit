import { Response } from "express";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * Standardized auth response helper
 * Sets auth cookie and returns success response with user and token
 */
export function sendAuthResponse(
  res: Response,
  user: User,
  token: string,
  statusCode: number = 200,
  message: string = "Success",
) {
  res.cookie("token", token, COOKIE_OPTIONS);

  return res.status(statusCode).json({
    success: true,
    message,
    user,
    token,
  });
}
