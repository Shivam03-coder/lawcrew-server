import { requireAuth } from "@clerk/express";
import { FinanceController } from "@src/controller/finance.controller";
import decryptPayload from "@src/middleware/decrypt.middleware";
import { Router } from "express";

const accountRouter = Router();

accountRouter
  .route("/create-account")
  .get(requireAuth(), decryptPayload, FinanceController.CreateAccount);

export default accountRouter;
