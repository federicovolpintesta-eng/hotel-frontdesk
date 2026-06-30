const pool = require('./database');
async function check() {
  const { rows } = await pool.query('SELECT id, created_at FROM evaluaciones WHERE empleado_id = 32 ORDER BY created_at ASC');
  console.log(rows);
  pool.end();
}
check();
