import { NextRequest, NextResponse } from "next/server";
import { aggregateDailyStats } from "@/lib/reporting/aggregator";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  return handleAggregation(req);
}

export async function GET(req: NextRequest) {
  return handleAggregation(req);
}

async function handleAggregation(req: NextRequest) {
  const session = await getSession();
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  let isAuthorized = false;
  if (session) {
    isAuthorized = true;
  } else if (expectedSecret) {
    const isBearerValid = authHeader === `Bearer ${expectedSecret}`;
    const isHeaderValid = cronHeader === expectedSecret;
    if (isBearerValid || isHeaderValid) {
      isAuthorized = true;
    }
  } else {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized Cron invocation" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || undefined;

    const result = await aggregateDailyStats(dateParam);
    return NextResponse.json({
      success: true,
      message: "Daily stats aggregation completed successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Aggregation cron error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
