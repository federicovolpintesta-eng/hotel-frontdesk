const pool = require('./database');
async function check() {
  const res = await pool.query('SELECT id, nombre, empresa_id FROM empleados WHERE uuid = $1', ['d61e7990-e742-4f2c-bba1-a571b65d73bf']);
  console.log(res.rows);
  pool.end();
}
check();
