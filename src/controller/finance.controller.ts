import { getAuth } from "@clerk/express";
import { db } from "@src/db";
import {
  ApiError,
  ApiResponse,
  AsyncHandler,
} from "@src/helpers/server-functions";
import { DecryptedRequest } from "@src/types/types";
import { Response } from "express";

export class FinanceController {
  private static getDecryptedData(decryptedData: any) {
    if (!decryptedData) {
      throw new ApiError(400, "No decrypted data found");
    }
    return decryptedData;
  }

  public static CreateAccount = AsyncHandler(
    async (req: DecryptedRequest, res: Response): Promise<void> => {
      const { userId } = getAuth(req);
      if (!userId) throw new ApiError(401, "Unauthorized");

      const decryptedData = FinanceController.getDecryptedData(
        req.decryptedData
      );

      const { balance, isDefault, name, type } = decryptedData;
      console.log("🚀 ~ FinanceController ~ decryptedData:", decryptedData);

      if (!name || !type) {
        throw new ApiError(400, "Missing required fields: name or type");
      }

      const balanceFloat = parseFloat(balance);
      if (isNaN(balanceFloat)) {
        throw new ApiError(400, "Invalid balance");
      }

      const user = await db.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new ApiError(404, "User not found");

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

      res.json(
        new ApiResponse(201, "Account created successfully", {
          account,
        })
      );
    }
  );
}
