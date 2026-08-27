import { parseReportMessage } from "../lib/telegram/parser";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

console.log("🧪 Testing Telegram Message Parser...\n");

// Test 1: Standard valid report
const test1 = `/report
1- پیاده‌سازی فرم لاگین جدید - انجام شد
2- تست وب‌هوک تلگرام - ناقص مانده
3- مستندسازی API - لغو شد`;

const res1 = parseReportMessage(test1);
assert(res1.isValid === true, "Valid 3-task report parsed successfully");
assert(res1.items.length === 3, "Parsed exactly 3 items");
assert(res1.items[0].status === "done", "First item is 'done'");
assert(res1.items[1].status === "incomplete", "Second item is 'incomplete'");
assert(res1.items[2].status === "cancelled", "Third item is 'cancelled'");

// Test 2: Persian digits
const test2 = `/report
۱. طراحی صفحه اصلی - انجام شد
۲. اصلاح ریسپانسیو - انجام شد`;

const res2 = parseReportMessage(test2);
assert(res2.isValid === true, "Persian digits and dot delimiter parsed successfully");
assert(res2.items[0].order === 1, "Persian digit ۱ converted to order 1");
assert(res2.items[1].order === 2, "Persian digit ۲ converted to order 2");

// Test 3: Invalid line status
const test3 = `/report
1- تست موفق - اوکی شد`;

const res3 = parseReportMessage(test3);
assert(res3.isValid === false, "Invalid status 'اوکی شد' is rejected");
assert(res3.errorLine === 2, "Error line reported correctly as line 2");

// Test 4: Missing /report prefix
const test4 = `1- تست بدون کامند - انجام شد`;
const res4 = parseReportMessage(test4);
assert(res4.isValid === false, "Message without /report header is rejected");

console.log("\n🎉 All parser unit tests passed successfully!");
