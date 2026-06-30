const pool = require('./database');
async function check() {
  const res = await pool.query('SELECT * FROM evaluaciones ORDER BY created_at DESC LIMIT 1');
  console.log(res.rows[0]);
  pool.end();
}
check();
