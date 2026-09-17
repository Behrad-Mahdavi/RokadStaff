import { NextRequest, NextResponse } from "next/server";
import { bot, ensureBotInitialized } from "@/lib/telegram/bot";

export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  // Verify webhook secret strictly
  if (configuredSecret) {
    if (!secretHeader || secretHeader !== configuredSecret) {
      console.warn("Unauthorized webhook request rejected");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const update = await req.json();
    await ensureBotInitialized();
    await bot.handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { ok: false, error: "Processing failed" },
      { status: 200 } // Telegram requires 200 OK to acknowledge receipt
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
  });
}

