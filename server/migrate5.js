const pool = require('./database');

async function runMigration() {
  try {
    console.log("Starting migration 5...");
    await pool.query(`
      ALTER TABLE evaluaciones 
      ADD COLUMN IF NOT EXISTS respuestas_detalle JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("Added respuestas_detalle column to evaluaciones table.");
  } catch (err) {
    console.error("Migration failed", err);
  }
}

runMigration();
