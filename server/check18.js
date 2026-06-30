const pool = require('./database');
async function check() {
  const { rows } = await pool.query("SELECT e.id as emp_id, ev.id as ev_id, ev.created_at, ev.nps_global, (ev.respuestas_detalle IS NOT NULL) as has_respuestas FROM empleados e JOIN evaluaciones ev ON e.id = ev.empleado_id WHERE e.nombre = 'Marcelo Sotelo'");
  console.log(rows);
  pool.end();
}
check();
