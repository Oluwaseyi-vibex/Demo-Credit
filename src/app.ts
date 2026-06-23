import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes/index.ts";
import { errorHandler } from "./middlewares/error.middleware.ts";
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API is healthy",
    });
});

app.use("/api/v1", routes);

app.use(errorHandler);

app.use("*", (_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

export default app;