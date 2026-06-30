const pool = require('./database');
async function move() {
  await pool.query('UPDATE evaluaciones SET empleado_id = 32 WHERE id = 49');
  console.log("Moved Eval 49 to Employee 32");
  pool.end();
}
move();
