const pool = require('./database');
async function check() {
  const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'evaluaciones' AND column_name = 'respuestas_detalle'`);
  console.log(res.rows);
  pool.end();
}
check();
