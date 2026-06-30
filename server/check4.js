const pool = require('./database');
async function check() {
  const res = await pool.query('SELECT e.id, e.nps_global, e.created_at FROM evaluaciones e ORDER BY id DESC LIMIT 5');
  console.log(res.rows);
  pool.end();
}
check();
