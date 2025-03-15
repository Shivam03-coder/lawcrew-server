import arcjet, { detectBot, tokenBucket } from "@arcjet/node";
import { appEnvConfigs } from "@src/configs";

const Aj = arcjet({
  key: appEnvConfigs.ARC_JET_PUBLISHABLE_KEY!,
  characteristics: ["userId"],
  rules: [
    tokenBucket({
      mode: "LIVE",
      refillRate: 10,
      interval: 3600,
      capacity: 10,
    }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
  ],
});

export default Aj;