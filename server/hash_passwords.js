const db = require('./database');
const bcrypt = require('bcrypt');

async function migrate() {
  try {
    // 1. Update admin user (id=1)
    const adminHash = await bcrypt.hash('password', 10);
    await db.query('UPDATE empresas SET password_hash = $1 WHERE email_contacto = $2', [adminHash, 'rrhh@lospinos.com']);
    console.log('Admin password hashed.');

    // 2. Update all Area Managers
    const { rows: users } = await db.query('SELECT id, password_hash FROM usuarios_area');
    for (const user of users) {
      // If it doesn't look like a bcrypt hash (starts with $2b$ or $2a$), hash it
      if (!user.password_hash.startsWith('$2')) {
        const hash = await bcrypt.hash(user.password_hash, 10);
        await db.query('UPDATE usuarios_area SET password_hash = $1 WHERE id = $2', [hash, user.id]);
        console.log(`User ${user.id} password hashed.`);
      }
    }
    console.log('Migration complete.');
  } catch(err) {
    console.error(err);
  }
}

migrate();
