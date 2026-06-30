const pool = require('./database');
async function check() {
  const res = await pool.query('SELECT e.id, e.nps_global, e.respuestas_detalle FROM evaluaciones e WHERE e.id IN (48, 49)');
  console.log(res.rows.map(r => ({ id: r.id, type: typeof r.respuestas_detalle, isArray: Array.isArray(r.respuestas_detalle), length: r.respuestas_detalle?.length })));
  pool.end();
}
check();
