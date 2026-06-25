import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function protect(req: Request, res: Response, next: NextFunction) {
  let token = "";
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(";").map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith("token="));
    if (tokenCookie) {
      token = tokenCookie.split("=")[1];
    }
  }

  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (error) {
    throw new AppError("Unauthorized", 401);
  }
}
