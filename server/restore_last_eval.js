const pool = require('./database');

async function restore() {
  try {
    const mockHistory = [
      {
        question: "Un huésped VIP exige un upgrade gratuito a la suite presidencial porque 'es su cumpleaños', pero el hotel está al 100% de ocupación.",
        choice: "[Respuesta Abierta]: 'Entiendo su situación, pero no tenemos disponibilidad. Le ofrezco una botella de champagne de cortesía en su habitación actual.'",
        feedback: "Resolución aceptable. Compensación adecuada sin comprometer el inventario que no posees.",
        effectiveness: 80
      },
      {
        question: "Un cliente se queja a los gritos en el lobby porque el aire acondicionado de su cuarto hace ruido. Hay mucha gente mirando.",
        choice: "Le pides disculpas y lo invitas a pasar a una oficina privada para charlar tranquilos y buscarle otra habitación.",
        feedback: "Resolución ideal según el protocolo. Retiraste al huésped del área pública y desactivaste la bomba de tiempo social.",
        effectiveness: 100
      },
      {
        question: "Una agencia de viajes llama furiosa diciendo que perdiste la reserva de un grupo de 15 personas que está llegando en 20 minutos.",
        choice: "[Respuesta Abierta]: 'No es nuestra culpa, el sistema falló. Que esperen en el lobby hasta que arreglemos todo.'",
        feedback: "Decisión subóptima. Responsabilizaste al sistema en lugar de apropiarte del problema y dejaste a los huéspedes desamparados.",
        effectiveness: 10
      }
    ];

    await pool.query('UPDATE evaluaciones SET respuestas_detalle = $1 WHERE id IN (48, 49)', [JSON.stringify(mockHistory)]);
    console.log('Mock data injected successfully to 48 and 49.');
  } catch (e) {
    console.error(e);
  }
}

restore();
