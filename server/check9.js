const pool = require('./database');
async function check() {
  const { rows } = await pool.query('SELECT respuestas_detalle FROM evaluaciones WHERE id = 49');
  console.log(JSON.stringify(rows[0].respuestas_detalle, null, 2));
  pool.end();
}
check();
