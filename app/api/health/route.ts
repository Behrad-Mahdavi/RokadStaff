import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasTelegramToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    hasWebhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
    telegramTokenPrefix: process.env.TELEGRAM_BOT_TOKEN
      ? process.env.TELEGRAM_BOT_TOKEN.slice(0, 10) + "..."
      : null,
  });
}
