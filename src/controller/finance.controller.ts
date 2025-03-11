import { getAuth } from "@clerk/express";
import { db } from "@src/db";
import {
  ApiError,
  ApiResponse,
  AsyncHandler,
} from "@src/helpers/server-functions";
import { Request, Response } from "express";

export class FinanceController {
  public static CreateAccount = AsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = getAuth(req);
      const { balance, isDefault, name, type } = req.body;

      const user = await db.user.findUnique({
        where: { id: userId as string },
      });

      if (!user) throw new ApiError(404, "User not found");

      const balanceFloat = parseFloat(balance);

      if (isNaN(balanceFloat)) throw new ApiError(404, "Balance Inavlid");

      const userAccount = await db.account.findMany({
        where: { userId: user.id },
      });

      const shouldbeDefault = userAccount.length === 0 ? true : isDefault;

      if (shouldbeDefault) {
        await db.account.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      const account = await db.account.create({
        data: {
          name,
          type,
          userId: user.id,
          balance: balanceFloat,
          isDefault: shouldbeDefault,
        },
      });

      res.json(new ApiResponse(200, "Account Created Successfully", account));
    }
  );
}
