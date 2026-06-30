const pool = require('./database');
async function check() {
  const res = await pool.query('SELECT id, nombre, empresa_id FROM empleados WHERE nombre = $1', ['Marcelo Sotelo']);
  console.log(res.rows);
  pool.end();
}
check();
