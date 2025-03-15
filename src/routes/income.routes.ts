import { Router } from "express";
import { requireAuth } from "@clerk/express";
import decryptPayload from "@src/middleware/decrypt.middleware";
import { FinanceController } from "@src/controller/income.controller";
import { shield } from "@arcjet/node";
import Aj from "@src/middleware/security.middleware";
import Security from "@src/middleware/security.middleware";
import { upload } from "@src/middleware/multer.middleware";

const financeRouter = Router();

/**
 * ==========================
 *        ACCOUNTS
 * ==========================
 */

// Create an account / Get all accounts
financeRouter
  .route("/accounts")
  .post(requireAuth(), decryptPayload, FinanceController.CreateAccount)
  .get(requireAuth(), FinanceController.GetAllAccounts);

// Update a specific account (e.g., set default account)
financeRouter
  .route("/accounts/:accountId")
  .patch(requireAuth(), FinanceController.UpdateDefaultAccount);

/**
 * ==========================
 *     ACCOUNT TRANSACTIONS
 * ==========================
 */

// Get/Delete transactions for a specific account
financeRouter
  .route("/accounts/:accountId/transactions")
  .get(requireAuth(), FinanceController.GetAccountTransactions)
  .delete(requireAuth(), FinanceController.DeleteAccountTransactions);

// Create a transaction (linked to any account)
financeRouter
  .route("/accounts/transactions")
  .post(
    requireAuth(),
    Security,
    decryptPayload,
    FinanceController.CreateTransaction
  );

// ScanReciept
financeRouter.post(
  "/accounts/transactions/scan-reciept",
  requireAuth(),
  Security,
  upload.single("receipt"),
  FinanceController.ScanReciept
);

// TODO: Implement budget tracking and budget alerts
/**
 * ==========================
 *        BUDGETS
 * ==========================
 */

// Get/Update budget for the current account
financeRouter
  .route("/accounts/budget")
  .get(requireAuth(), FinanceController.GetCurrentAccountBudget)
  .post(requireAuth(), decryptPayload, FinanceController.UpdateAccountBudget);

export default financeRouter;
