import { createRouteHandler } from "uploadthing/server";
import { ourFileRouter } from "@/lib/uploadthing";

const handler = createRouteHandler({
  router: ourFileRouter,
});

export const GET = (req: Request) => handler(req);
export const POST = (req: Request) => handler(req);
