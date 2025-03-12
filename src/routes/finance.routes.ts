import { requireAuth } from "@clerk/express";
import { FinanceController } from "@src/controller/finance.controller";
import decryptPayload from "@src/middleware/decrypt.middleware";
import { Router } from "express";

const financeRouter = Router();

financeRouter
  .route("/create-account")
  .post(requireAuth(), decryptPayload, FinanceController.CreateAccount);

export default financeRouter;
