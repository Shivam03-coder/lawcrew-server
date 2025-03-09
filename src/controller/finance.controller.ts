import { AsyncHandler } from "@src/helpers/server-functions";
import { Request, Response } from "express";

export class FinanceController {
  public static UserSync = AsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        // Your logic here
    }
  );
}
