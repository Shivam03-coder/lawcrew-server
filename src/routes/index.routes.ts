import financeRouter from "./finance.routes";
import userRouter from "./user.routes";

export default [
  { path: "user", router: userRouter },
  { path: "finance", router: financeRouter },
];
