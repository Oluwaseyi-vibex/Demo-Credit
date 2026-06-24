import { Request, Response, NextFunction } from "express";

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error(err);

    const statusCode =
        "statusCode" in err && typeof err.statusCode === "number"
            ? err.statusCode
            : 500;

    const message =
        "message" in err && typeof err.message === "string"
            ? err.message
            : "Internal server error";

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};