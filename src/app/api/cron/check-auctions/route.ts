import { NextRequest, NextResponse } from "next/server";
import { processEndedAuctions } from "@/actions/auction-actions";

export async function GET(request: NextRequest) {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processEndedAuctions();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to process ended auctions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
