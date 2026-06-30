const pool = require('./database');
async function check() {
  const res = await pool.query('SELECT e.id, e.empleado_id, emp.nombre, e.created_at, e.respuestas_detalle FROM evaluaciones e JOIN empleados emp ON e.empleado_id = emp.id ORDER BY e.id DESC LIMIT 5');
  res.rows.forEach(r => {
    console.log(`Eval ID: ${r.id}, Emp ID: ${r.empleado_id}, Nombre: ${r.nombre}, Date: ${r.created_at}, Data Array?: ${Array.isArray(r.respuestas_detalle)}, Length: ${r.respuestas_detalle?.length}`);
  });
  pool.end();
}
check();
