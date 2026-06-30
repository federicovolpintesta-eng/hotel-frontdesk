const pool = require('./database');
async function check() {
  const { rows } = await pool.query('SELECT id, uuid_evaluacion FROM empleados WHERE id = 32');
  console.log(rows);
  pool.end();
}
check();
