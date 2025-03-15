import { getAuth } from "@clerk/express";
import { ApiError, AsyncHandler } from "@src/helpers/server-functions";
import Aj from "@src/security/arc";
import { NextFunction, Request, Response } from "express";

const Security = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = getAuth(req);

    if (!userId) {
      return next();
    }

    const decision = await Aj.protect(req, {
      requested: 1,
      userId,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new ApiError(429, "🚫 Too many requests!");
      } else if (decision.reason.isBot()) {
        throw new ApiError(403, "🤖 Bot access denied!");
      } else {
        throw new ApiError(403, "❌ Request blocked!");
      }
    }

    next();
  }
);

export default Security;
