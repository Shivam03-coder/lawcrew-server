import { requireAuth } from "@clerk/express";
import { FinanceController } from "@src/controller/income.controller";
import decryptPayload from "@src/middleware/decrypt.middleware";
import { Router } from "express";

const financeRouter = Router();

financeRouter
  .route("/accounts")
  .post(requireAuth(), decryptPayload, FinanceController.CreateAccount)
  .get(requireAuth(), FinanceController.GetAllAccounts);

financeRouter
  .route("/accounts/:accountId")
  .patch(requireAuth(), FinanceController.UpdateDefaultAccount);

financeRouter
  .route("/accounts/:accountId/transactions")
  .get(requireAuth(), FinanceController.GetAccountTransactions)
  .delete(requireAuth(), FinanceController.DeleteAccountTransactions);

financeRouter
  .route("/accounts/transactions")
  .post(requireAuth(), decryptPayload, FinanceController.CreateTransaction);

financeRouter
  .route("/accounts/budget")
  .get(requireAuth(), FinanceController.GetCurrentAccountBudget)
  .post(requireAuth(), decryptPayload, FinanceController.UpdateAccountBudget);

// UpdateAccountBudget

export default financeRouter;
