import { bot, ensureBotInitialized } from "./bot";

// Delay helper to respect Telegram API rate limits (max ~30 msg/sec)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface OutboundMessage {
  chatId: number;
  text: string;
  parseMode?: "Markdown" | "HTML";
}

class TelegramNotificationService {
  private isProcessing = false;
  private queue: OutboundMessage[] = [];

  /**
   * Enqueue a message to be sent with rate limiting
   */
  async enqueue(message: OutboundMessage): Promise<void> {
    this.queue.push(message);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Send a direct message immediately (awaitable)
   */
  async sendDirect(
    chatId: number,
    text: string,
    parseMode: "Markdown" | "HTML" = "Markdown",
    disablePreview: boolean = true
  ): Promise<boolean> {
    try {
      await ensureBotInitialized();
      await bot.api.sendMessage(chatId, text, {
        parse_mode: parseMode,
        link_preview_options: { is_disabled: disablePreview },
      });
      return true;
    } catch (err) {
      console.error(`Failed to send Telegram message to ${chatId}:`, err);
      return false;
    }
  }

  private async processQueue() {
    this.isProcessing = true;
    try {
      await ensureBotInitialized();

      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (!item) break;

        try {
          await bot.api.sendMessage(item.chatId, item.text, {
            parse_mode: item.parseMode || "Markdown",
            link_preview_options: { is_disabled: true },
          });
        } catch (err) {
          console.error(`Error sending queued message to ${item.chatId}:`, err);
        }

        // 50ms rate limit between outbound telegram messages
        await delay(50);
      }
    } catch (error) {
      console.error("Telegram queue processor error:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 1. Magic Link Login Message
   */
  async sendMagicLink(chatId: number, fullName: string, loginUrl: string): Promise<boolean> {
    const text = `🔐 *ورود به میز کار رُکاد‌استاف (Rotello)*

همکار گرامی *${fullName}*،
برای ورود مستقیم به پنل مدیریت تسک‌ها و پروژه‌ها، روی لینک زیر کلیک کنید:

👉 [ورود مستقیم به پنل کاربری](${loginUrl})

⏱ _این لینک اختصاصی است و به مدت ۱۰ دقیقه معتبر خواهد بود._
🌿 _سامانه مدیریت پروژه رُکاد‌استاف_`;

    return await this.sendDirect(chatId, text, "Markdown", true);
  }

  /**
   * 2. Task Assignment Notification
   */
  async sendTaskAssigned(
    chatId: number,
    fullName: string,
    taskTitle: string,
    projectName: string,
    assignedByName: string,
    deadlineJalali?: string
  ): Promise<boolean> {
    let text = `📌 *تسک جدید به شما محول شد*

همکار گرامی *${fullName}*،
تسک جدید زیر در پروژه *«${projectName}»* توسط *${assignedByName}* به شما واگذار گردید:

📝 *عنوان:* ${taskTitle}`;

    if (deadlineJalali) {
      text += `\n⏰ *مهلت انجام (ددلاین):* ${deadlineJalali}`;
    }

    text += `\n\nبرای مشاهده جزئیات و ثبت گزارش کار، به میز کار خود در وب مراجعه کنید.`;

    return await this.sendDirect(chatId, text, "Markdown", true);
  }
}

export const notifyService = new TelegramNotificationService();
