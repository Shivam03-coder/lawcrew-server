import { requireAuth } from "@clerk/express";
import { FinanceController } from "@src/controller/finance.controller";
import { Router } from "express";

const accountRouter = Router();

accountRouter.route("/create").get(requireAuth(), FinanceController.Account);

export default accountRouter;
