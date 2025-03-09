import { getAuth } from "@clerk/express";
import { db } from "@src/db";
import { ApiResponse, AsyncHandler } from "@src/helpers/server-functions";
import { Request, Response } from "express";

export class FinanceController {
  public static Account = AsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = getAuth(req);

      const user = await db.user.findUnique({
        where: { id: userId as string },
      });
      console.log(user);
      res.json(new ApiResponse(200, `${userId}`));
    }
  );
}
