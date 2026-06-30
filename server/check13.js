async function check() {
  try {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 3, rol: 'admin', tipo_empresa: 'hotel' }, process.env.JWT_SECRET || 'caos_secret_123');

    const res = await fetch('http://localhost:3001/api/hr/empleados/32/analisis', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      console.log('Error', res.status);
      const text = await res.text();
      console.log(text);
      return;
    }
    
    const data = await res.json();
    console.log(typeof data.respuestas_detalle);
    console.log(Array.isArray(data.respuestas_detalle));
    console.log(data.respuestas_detalle ? data.respuestas_detalle.length : 0);
  } catch(e) {
    console.error(e);
  }
}
check();
