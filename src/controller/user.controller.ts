import { appEnvConfigs } from "@src/configs";
import { db } from "@src/db";
import {
  ApiError,
  ApiResponse,
  AsyncHandler,
} from "@src/helpers/server-functions";
import { Request, Response } from "express";
import { Webhook } from "svix";

export class UserController {
  public static UserSync = AsyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // ✅ GET SIGNING SECRET FROM ENV VARIABLES
      const SIGNING_SECRET = appEnvConfigs.SIGNING_SECRET;
      if (!SIGNING_SECRET)
        throw new ApiError(
          400,
          "PLEASE ADD SIGNING_SECRET FROM CLERK DASHBOARD TO .ENV"
        );

      // ✅ INITIALIZE SVIX WEBHOOK HANDLER
      const wh = new Webhook(SIGNING_SECRET);
      const headers = req.headers;
      const payload = req.body;

      // ✅ EXTRACT WEBHOOK HEADERS
      const svix_id = headers["svix-id"];
      const svix_timestamp = headers["svix-timestamp"];
      const svix_signature = headers["svix-signature"];

      // ✅ VALIDATE MANDATORY HEADERS
      if (!svix_id || !svix_timestamp || !svix_signature)
        throw new ApiError(400, "MISSING REQUIRED HEADERS");

      let evt: any;

      try {
        // ✅ VERIFY WEBHOOK SIGNATURE
        evt = wh.verify(JSON.stringify(payload), {
          "svix-id": svix_id as string,
          "svix-timestamp": svix_timestamp as string,
          "svix-signature": svix_signature as string,
        });
      } catch (err) {
        throw new ApiError(401, "INVALID SIGNATURE");
      }

      // ✅ LOG WEBHOOK EVENT DATA
      console.log(evt.data);

      // ✅ EXTRACT USER DETAILS FROM WEBHOOK EVENT
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;
      const email = evt.data.email_addresses[0].email_address;
      const eventType = evt.type;
      console.log(
        `RECEIVED WEBHOOK WITH ID ${id} AND EVENT TYPE OF ${eventType}`
      );
      // ✅ HANDLE USER CREATION OR UPDATE
      if (eventType === "user.created" || eventType === "user.updated") {
        await db.user.upsert({
          where: { id },
          update: {
            email,
            firstName: first_name,
            lastName: last_name,
            imageUrl: image_url,
          },
          create: {
            id,
            email,
            firstName: first_name,
            lastName: last_name,
            imageUrl: image_url,
          },
        });
      }

      // ✅ SEND SUCCESS RESPONSE
      res.status(200).json(new ApiResponse(201, "USER SYNCED IN DATABASE"));
    }
  );
}
