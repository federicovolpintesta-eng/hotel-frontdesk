const db = require('./database');
async function check() {
  try {
    const res = await db.query("SELECT conname FROM pg_constraint WHERE conrelid = 'usuarios_area'::regclass");
    console.log(res.rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();
