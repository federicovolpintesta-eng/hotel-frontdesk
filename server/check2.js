const pool = require('./database');
async function check() {
  const res = await pool.query('SELECT respuestas_detalle FROM evaluaciones ORDER BY id DESC LIMIT 1');
  console.log(typeof res.rows[0].respuestas_detalle);
  console.log(Array.isArray(res.rows[0].respuestas_detalle));
  console.log(res.rows[0].respuestas_detalle);
  pool.end();
}
check();
