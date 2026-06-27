const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_OqaMUwvD4XC8@ep-noisy-butterfly-atb9lbzo-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

pool.on('connect', client => {
  client.query('SET search_path TO public');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
