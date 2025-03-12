import { requireAuth } from "@clerk/express";
import { FinanceController } from "@src/controller/finance.controller";
import decryptPayload from "@src/middleware/decrypt.middleware";
import { Router } from "express";

const financeRouter = Router();

financeRouter
  .route("/accounts")
  .post(requireAuth(), decryptPayload, FinanceController.CreateAccount)
  .get(requireAuth(), FinanceController.GetAllAccounts);

export default financeRouter;
