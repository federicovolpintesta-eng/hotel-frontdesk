const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_OqaMUwvD4XC8@ep-noisy-butterfly-atb9lbzo-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
});
async function test() {
  try {
    const { rows } = await pool.query('SELECT id, nombre, email_contacto, password_hash FROM empresas');
    console.log(rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
test();
