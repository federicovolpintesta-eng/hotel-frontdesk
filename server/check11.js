const pool = require('./database');
const fetch = require('node-fetch');

async function check() {
  const { rows } = await pool.query('SELECT uuid FROM empresas WHERE id = 3');
  const token = 'admin'; // wait, hrToken is just a JWT or something?
  // I don't have the token. I can just bypass auth for the test.
}
check();
