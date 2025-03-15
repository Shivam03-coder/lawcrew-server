import { getAuth } from "@clerk/express";
import { db } from "@src/db";
import { calculateNextRecurringDate, monthNames } from "@src/helpers/const";
import {
  ApiError,
  ApiResponse,
  AsyncHandler,
} from "@src/helpers/server-functions";
import { DecryptedRequest } from "@src/types/types";
import { Request, Response } from "express";

export class FinanceController {
  private static getDecryptedData(decryptedData: any) {
    if (!decryptedData) {
      throw new ApiError(400, "No decrypted data found");
    }
    return decryptedData;
  }

  private static CheckUserId = async (req: Request) => {
    const { userId } = getAuth(req);
    if (!userId) throw new ApiError(401, "Unauthorized");
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return user;
  };

  public static CreateAccount = AsyncHandler(
    async (req: DecryptedRequest, res: Response): Promise<void> => {
      const user = await FinanceController.CheckUserId(req);

      const decryptedData = FinanceController.getDecryptedData(
        req.decryptedData
      );

      const { balance, isDefault, name, type } = decryptedData;

      if (!name || !type) {
        throw new ApiError(400, "Missing required fields: name or type");
      }

      const balanceFloat = parseFloat(balance);
      if (isNaN(balanceFloat)) {
        throw new ApiError(400, "Invalid balance");
      }

      const userAccounts = await db.account.findMany({
        where: { userId: user.id },
      });

      const shouldBeDefault = userAccounts.length === 0 || !!isDefault;

      if (shouldBeDefault) {
        await db.account.updateMany({
          where: {
            userId: user.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const account = await db.account.create({
        data: {
          userId: user.id,
          name,
          type,
          balance: balanceFloat,
          isDefault: shouldBeDefault,
        },
      });

      res.json(new ApiResponse(201, "Account created successfully"));
    }
  );

  public static GetAllAccounts = AsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await FinanceController.CheckUserId(req);

      const accounts = await db.account.findMany({
        where: { userId: user.id },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(new ApiResponse(200, "Accounts fetched successfully", accounts));
    }
  );

  public static UpdateDefaultAccount = AsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await FinanceController.CheckUserId(req);
      const { accountId } = req.params;
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: {
          isDefault: false,
        },
      });

      const account = await db.account.update({
        where: {
          id: accountId,
        },
        data: {
          isDefault: true,
        },
      });

      res.json(
        new ApiResponse(200, "Default account updated successfully", account)
      );
    }
  );

  public static GetAccountTransactions = AsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await FinanceController.CheckUserId(req);
      const { accountId } = req.params;

      const account = await db.account.findUnique({
        where: {
          id: accountId,
          userId: user.id,
        },
        include: {
          transactions: {
            orderBy: {
              date: "desc",
            },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });

      if (!account) {
        throw new ApiError(
          404,
          "Account not found or does not belong to the user"
        );
      }

      res.json(
        new ApiResponse(200, "Transactions fetched successfully", account)
      );
    }
  );

  public static DeleteAccountTransactions = AsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await FinanceController.CheckUserId(req);
      const transactionIdsParam = req.body.transactionIds;

      if (
        !transactionIdsParam ||
        (Array.isArray(transactionIdsParam) && transactionIdsParam.length === 0)
      ) {
        res
          .status(400)
          .json(new ApiResponse(400, "No transaction IDs provided"));
        return;
      }

      let transactionIds: string[] = [];

      if (typeof transactionIdsParam === "string") {
        transactionIds = transactionIdsParam.split(",").map((id) => id.trim());
      } else if (Array.isArray(transactionIdsParam)) {
        transactionIds = transactionIdsParam
          .map((id) => (typeof id === "string" ? id.trim() : ""))
          .filter(Boolean);
      }

      if (transactionIds.length === 0) {
        res.status(400).json(new ApiResponse(400, "Invalid transaction IDs"));
        return;
      }

      const transactions = await db.transaction.findMany({
        where: {
          id: {
            in: transactionIds,
          },
          userId: user.id,
        },
      });

      if (transactions.length === 0) {
        res
          .status(404)
          .json(new ApiResponse(404, "No transactions found for deletion"));
        return;
      }

      const accountBalanceChanges = transactions.reduce((acc, transaction) => {
        const amount = Number(transaction.amount);
        const accountId = transaction.accountId;

        const balanceChange =
          transaction.type === "EXPENSE" || transaction.type === "TRANSFER"
            ? amount
            : -amount;

        acc[accountId] = (acc[accountId] || 0) + balanceChange;

        return acc;
      }, {} as Record<string, number>);

      await db.$transaction(async (tx) => {
        await tx.transaction.deleteMany({
          where: {
            id: {
              in: transactionIds,
            },
            userId: user.id,
          },
        });

        for (const [accountId, balanceChange] of Object.entries(
          accountBalanceChanges
        )) {
          await tx.account.update({
            where: { id: accountId },
            data: {
              balance: {
                increment: balanceChange,
              },
            },
          });
        }
      });

      res.json(new ApiResponse(200, "Transactions deleted successfully"));
    }
  );

  public static GetCurrentAccountBudget = AsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await FinanceController.CheckUserId(req);
      const { accountId } = req.body;

      const budget = await db.budget.findFirst({
        where: {
          userId: user.id,
        },
      });

      const currentDate = new Date();
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const expenses = await db.transaction.aggregate({
        where: {
          userId: user.id,
          accountId,
          type: "EXPENSE",
          date: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const totalExpenses = expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0;

      const totalBudget = {
        budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
        currentExpenses: totalExpenses,
      };

      res.json(
        new ApiResponse(
          200,
          "Current account budget fetched successfully",
          totalBudget
        )
      );
    }
  );

  public static UpdateAccountBudget = AsyncHandler(
    async (req: DecryptedRequest, res: Response): Promise<void> => {
      const user = await FinanceController.CheckUserId(req);
      const { amount } = FinanceController.getDecryptedData(req.decryptedData);
      if (!amount) {
        throw new ApiError(400, "No new budget provided in request body");
      }

      await db.budget.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          amount,
        },
        update: {
          amount,
        },
      });
      res.json(new ApiResponse(200, "Budget updated successfully"));
    }
  );

  public static CreateTransaction = AsyncHandler(
    async (req: DecryptedRequest, res: Response): Promise<void> => {
      const user = await FinanceController.CheckUserId(req);
      const data = FinanceController.getDecryptedData(req.decryptedData);

      const requiredFields = [
        "accountId",
        "type",
        "amount",
        "description",
        "date",
        "category",
        "isRecurring",
        "recurringInterval",
      ];

      if (requiredFields.some((field) => data[field] === undefined)) {
        throw new ApiError(400, "Missing required fields in request body.");
      }

      const account = await db.account.findUnique({
        where: { id: data.accountId, userId: user.id },
      });

      if (!account) {
        throw new ApiError(404, "Account not found or unauthorized.");
      }

      const amountFloat = parseFloat(data.amount);
      if (isNaN(amountFloat)) {
        throw new ApiError(400, "Invalid amount.");
      }

      const balanceChange = ["EXPENSE"].includes(data.type)
        ? -amountFloat
        : amountFloat;
      const newBalance = account.balance.toNumber() + balanceChange;

      await db.$transaction(async (tx) => {
        await Promise.all([
          tx.transaction.create({
            data: {
              userId: user.id,
              accountId: data.accountId,
              ...data,
              amount: amountFloat,
              nextRecurringDate:
                data.isRecurring && data.recurringInterval
                  ? calculateNextRecurringDate(
                      data.date,
                      data.recurringInterval
                    )
                  : null,
            },
          }),

          tx.account.update({
            where: { id: data.accountId },
            data: { balance: newBalance },
          }),
        ]);
      });

      res.json(new ApiResponse(201, `Transaction  created successfully`));
    }
  );
}
