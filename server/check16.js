const pool = require('./database');
async function test() {
    const { rows: evalRows } = await pool.query(`
      SELECT * FROM evaluaciones WHERE empleado_id = 32 ORDER BY created_at ASC
    `);
    const latest = evalRows[evalRows.length - 1];
    
    const { rows: empRows } = await pool.query(`SELECT cv_summary, interview_questions, training_plan FROM empleados WHERE id = 32`);
    const empData = empRows[0] || {};

    let response = {
      respuestas_detalle: latest.respuestas_detalle || [],
    };
    
    console.log("Type in JS:", typeof latest.respuestas_detalle);
    console.log("IsArray:", Array.isArray(latest.respuestas_detalle));
    console.log("Stringified:", JSON.stringify(response));
    pool.end();
}
test();
