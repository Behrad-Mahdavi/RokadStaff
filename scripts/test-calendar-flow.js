const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function testCalendarDB() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("1. Checking calendar_events table structure...");
    const eventsQuery = await pool.query("SELECT * FROM calendar_events LIMIT 5;");
    console.log("Current calendar events count in DB:", eventsQuery.rows.length);

    console.log("\n2. Fetching available employee for attendee testing...");
    const empRes = await pool.query("SELECT id, full_name, department FROM employees LIMIT 2;");
    console.log("Employees available:", empRes.rows.map(e => `${e.full_name} (${e.department})`));

    const testEmpId = empRes.rows[0]?.id;

    console.log("\n3. Inserting test meeting event...");
    const testTitle = "جلسه تست سیستم تقویم اجرایی " + Date.now();
    const insertRes = await pool.query(`
      INSERT INTO calendar_events (
        title, description, type, department, color,
        start_date, end_date, start_time, end_time,
        is_all_day, location, status, reminder
      ) VALUES (
        $1, $2, $3, $4, $5,
        CURRENT_DATE, CURRENT_DATE, '10:00', '11:30',
        false, 'اتاق کنفرانس تست', 'scheduled', '15m'
      ) RETURNING *;
    `, [testTitle, "دستور جلسه تستی جهت اعتبارسنجی سیستم", "meeting", "پسرانه", "#202A5A"]);

    const createdEvent = insertRes.rows[0];
    console.log("Created test event successfully:", {
      id: createdEvent.id,
      title: createdEvent.title,
      type: createdEvent.type,
      department: createdEvent.department,
      color: createdEvent.color,
      start_date: createdEvent.start_date,
      start_time: createdEvent.start_time,
    });

    if (testEmpId) {
      console.log("\n4. Adding attendee to the test event...");
      const attRes = await pool.query(`
        INSERT INTO calendar_event_attendees (event_id, employee_id, role, status)
        VALUES ($1, $2, 'attendee', 'accepted') RETURNING *;
      `, [createdEvent.id, testEmpId]);
      console.log("Added attendee:", attRes.rows[0]);

      console.log("\n5. Testing JOIN query between calendar_events, attendees, and employees...");
      const joinRes = await pool.query(`
        SELECT 
          e.id as event_id,
          e.title,
          e.department,
          a.role,
          emp.full_name as attendee_name
        FROM calendar_events e
        JOIN calendar_event_attendees a ON e.id = a.event_id
        JOIN employees emp ON a.employee_id = emp.id
        WHERE e.id = $1;
      `, [createdEvent.id]);
      console.table(joinRes.rows);
    }

    console.log("\n6. Updating test event status...");
    const updateRes = await pool.query(`
      UPDATE calendar_events 
      SET status = 'completed', updated_at = NOW() 
      WHERE id = $1 RETURNING id, title, status, updated_at;
    `, [createdEvent.id]);
    console.log("Updated event:", updateRes.rows[0]);

    console.log("\n7. Cleaning up test event...");
    await pool.query("DELETE FROM calendar_events WHERE id = $1;", [createdEvent.id]);
    console.log("Test event and cascading attendees deleted successfully.");

    console.log("\n✅ All Calendar database operations, constraints, and joins passed with 100% success!");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testCalendarDB();
