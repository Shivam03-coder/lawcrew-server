import { getAuth } from "@clerk/express";
import { ApiResponse, AsyncHandler } from "@src/helpers/server-functions";
import { Request, Response } from "express";

export class FinanceController {
  public static Account = AsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = getAuth(req);
      res.json(new ApiResponse(200, `${userId}`));
    }
  );
}
