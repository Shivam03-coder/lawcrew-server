import { UserController } from "@src/controller/user.controller";
import bodyParser from "body-parser";
import { Router } from "express";

const userRouter = Router();

userRouter
  .route("/clerk/webhook")
  .post(bodyParser.raw({ type: "application/json" }), UserController.UserSync);

export default userRouter;
