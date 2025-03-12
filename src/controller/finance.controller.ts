import { getAuth } from "@clerk/express";
import { db } from "@src/db";
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
}
