const pool = require('./database');
async function check() {
  const { rows: evalRows } = await pool.query(`SELECT * FROM evaluaciones WHERE empleado_id = 32 ORDER BY created_at ASC`);
  const latest = evalRows[evalRows.length - 1];
  console.log(typeof latest.respuestas_detalle);
  console.log(Array.isArray(latest.respuestas_detalle));
  console.log(latest.respuestas_detalle ? latest.respuestas_detalle.length : 0);
  pool.end();
}
check();
