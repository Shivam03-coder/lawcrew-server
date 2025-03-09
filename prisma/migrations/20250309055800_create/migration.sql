/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accountId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "transactions_userId_accountId_key";

-- CreateIndex
CREATE UNIQUE INDEX "transactions_userId_key" ON "transactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_accountId_key" ON "transactions"("accountId");
