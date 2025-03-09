import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import bodyParser from "body-parser";
import { ApiError } from "./helpers/server-functions";
import cookieParser from "cookie-parser";
import { appEnvConfigs } from "./configs";
import userRouter from "./routes/user.routes";
import { clerkMiddleware } from "@clerk/express";
import accountRouter from "./routes/finance.routes";
export const app = express();

// MIDDLEWARES

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("common"));
app.use(clerkMiddleware());
// CORS CONFIGURATION

app.use(
  cors({
    origin: appEnvConfigs.NEXT_APP_URI || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

// ROUTES
app.use("/api/v1/user", userRouter);
app.use("/api/v1/account", accountRouter);

// GLOBAL ERROR HANDLER

app.use((err: ApiError, _req: any, res: any, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.json({
      code: err.code,
      status: "failed",
      message: err.message,
    });
  }
});
