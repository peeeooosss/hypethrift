import { NextRequest, NextResponse } from "next/server";
import { expireUnpaidOrders, processEndedAuctions } from "@/actions/auction-actions";
import { expireUnpaidRetailOrders } from "@/actions/retail-actions";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [auctions, unpaid, retailExpired] = await Promise.all([
      processEndedAuctions(),
      expireUnpaidOrders(),
      expireUnpaidRetailOrders(),
    ]);
    return NextResponse.json({ ...auctions, ...unpaid, ...retailExpired });
  } catch (error) {
    console.error("Failed to process ended auctions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
