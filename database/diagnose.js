const { Client } = require('pg');

// Use the same pooler connection string you used in init-db.js
const connectionString = process.env.DATABASE_URL || "https://tcpzenciiykmdhzrhamb.supabase.co";

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    console.log("\n=== STUDENTS ===");
    const students = await client.query(
      `select id, full_name, email, level, status from public.users where role = 'student'`
    );
    console.table(students.rows);

    console.log("\n=== COURSES ===");
    const courses = await client.query(
      `select code, title, level, semester, session from public.courses order by code`
    );
    console.table(courses.rows);

    console.log("\n=== CLASSES ===");
    const classes = await client.query(`
      select c.day, c.start_time, c.end_time, co.code, co.level, co.semester, co.session
      from public.classes c
      join public.courses co on co.id = c.course_id
      order by co.code
    `);
    console.table(classes.rows);

    console.log("\n=== ACADEMIC CALENDAR ===");
    const settings = await client.query(
      `select value from public.system_settings where key = 'academic_calendar'`
    );
    console.log(JSON.stringify(settings.rows[0]?.value, null, 2));

  } catch (err) {
    console.error("Diagnostic query failed:", err);
  } finally {
    await client.end();
  }
}

run();