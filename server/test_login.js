const fetch = require('node-fetch');
async function test() {
  try {
    const res = await fetch('https://caosfrontdesk-backend.onrender.com/api/hr/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rrhh@lospinos.com', password: 'password' })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Data:', data);
  } catch(e) {
    console.error(e);
  }
}
test();
