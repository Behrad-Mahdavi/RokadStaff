import { parseReportMessage } from "../lib/telegram/parser";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

console.log("🧪 Testing Telegram Message Parser...\n");

// Test 1: Standard numbered report
const test1 = `/report
1- پیاده‌سازی فرم لاگین جدید
2- تست وب‌هوک تلگرام
3- مستندسازی API`;

const res1 = parseReportMessage(test1);
assert(res1.isValid === true, "Valid 3-line report parsed successfully");
assert(res1.items.length === 3, "Parsed exactly 3 items");
assert(res1.items[0].description === "پیاده‌سازی فرم لاگین جدید", "First item description matches");

// Test 2: Persian digits
const test2 = `/report
۱. طراحی صفحه اصلی
۲. اصلاح ریسپانسیو`;

const res2 = parseReportMessage(test2);
assert(res2.isValid === true, "Persian digits parsed successfully");
assert(res2.items[0].order === 1, "Persian digit ۱ converted to order 1");
assert(res2.items[1].order === 2, "Persian digit ۲ converted to order 2");

// Test 3: Free text list
const test3 = `/report
جلسه هفتگی با تیم مارکتینگ
آماده‌سازی فایل اکسل گزارش‌ها`;

const res3 = parseReportMessage(test3);
assert(res3.isValid === true, "Free text lines parsed successfully");
assert(res3.items.length === 2, "Parsed 2 free text lines");

// Test 4: Missing /report prefix
const test4 = `تست بدون کامند`;
const res4 = parseReportMessage(test4);
assert(res4.isValid === false, "Message without /report header is rejected");

console.log("\n🎉 All parser unit tests passed successfully!");
