const pool = require('./database');
async function check() {
  const { rows } = await pool.query('SELECT id, created_at, respuestas_detalle FROM evaluaciones WHERE empleado_id = 32 ORDER BY created_at ASC');
  console.log(rows.map(r => ({
    id: r.id, 
    created_at: r.created_at, 
    respuestas_length: r.respuestas_detalle ? r.respuestas_detalle.length : 0 
  })));
  pool.end();
}
check();
