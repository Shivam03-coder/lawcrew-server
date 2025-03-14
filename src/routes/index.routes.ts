import financeRouter from "./income.routes";
import userRouter from "./user.routes";

export default [
  { path: "user", router: userRouter },
  { path: "finance", router: financeRouter },
];
