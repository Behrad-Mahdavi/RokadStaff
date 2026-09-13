const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function initCalendar() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in environment variables. Running in offline/mock fallback mode.");
    return;
  }

  const pool = new Pool({ connectionString });

  try {
    console.log("Connecting to PostgreSQL...");

    // 1. Create calendar_events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'meeting',
        department TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#59BBAF',
        start_date DATE NOT NULL,
        end_date DATE,
        start_time TEXT,
        end_time TEXT,
        is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        reminder TEXT NOT NULL DEFAULT 'none',
        created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
        created_by_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table 'calendar_events' verified/created.");

    // 2. Create calendar_event_attendees table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_event_attendees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'attendee',
        status TEXT NOT NULL DEFAULT 'pending',
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uniq_calendar_event_employee UNIQUE (event_id, employee_id)
      );
    `);
    console.log("Table 'calendar_event_attendees' verified/created.");

    // 3. Create indices
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
      CREATE INDEX IF NOT EXISTS idx_calendar_events_department ON calendar_events(department);
      CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
      CREATE INDEX IF NOT EXISTS idx_calendar_attendees_event ON calendar_event_attendees(event_id);
      CREATE INDEX IF NOT EXISTS idx_calendar_attendees_employee ON calendar_event_attendees(employee_id);
    `);
    console.log("Indices for calendar tables verified/created.");

    console.log("Calendar tables initialization completed successfully.");
  } catch (err) {
    console.error("Error initializing calendar tables:", err);
  } finally {
    await pool.end();
  }
}

initCalendar();
