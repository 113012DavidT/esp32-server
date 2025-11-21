require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Telemetry = require('./models/Telemetry');

const app = express();

app.use(cors());
app.use(express.json());

// -----------------------------------------------------
// FUNCION PARA CONVERTIR FECHA UTC → HORA LOCAL MÉXICO
// -----------------------------------------------------
function toMexicoTime(date) {
  return new Date(date).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour12: false
  });
}

// -----------------------------------------------------
// CONEXIÓN A MONGO
// -----------------------------------------------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado correctamente'))
  .catch(err => console.error('❌ Error MongoDB:', err));


// -----------------------------------------------------
// POST: RECIBIR DATOS DEL ESP32
// -----------------------------------------------------
app.post('/api/telemetry', async (req, res) => {
  try {
    const { temp, hum, timestamp } = req.body;

    if (temp === undefined || hum === undefined || !timestamp) {
      return res.status(400).json({ error: 'Faltan campos: temp, hum o timestamp' });
    }

    const fechaESP = new Date(timestamp);
    if (isNaN(fechaESP.getTime())) {
      return res.status(400).json({ error: 'Timestamp inválido' });
    }

    // Hora en que el servidor recibe el dato
    const horaRecepcion = new Date();

    const nuevoDato = new Telemetry({
      temp,
      hum,
      timestamp: fechaESP,
      horaRecepcion: horaRecepcion,
      horaGuardado: new Date()
    });

    await nuevoDato.save();

    console.log(`📩 Recibido → ${temp}°C | ${hum}% | ESP:${timestamp} | Servidor:${horaRecepcion}`);

    res.status(201).json({
      message: 'Dato guardado correctamente',
      id: nuevoDato._id,
      horaLocal: toMexicoTime(horaRecepcion)
    });

  } catch (err) {
    console.error('❌ Error guardando dato:', err);
    res.status(500).json({ error: err.message });
  }
});



// -----------------------------------------------------
// GET: LISTAR DATOS EN HORA LOCAL DE MÉXICO
// -----------------------------------------------------
app.get('/api/telemetry', async (req, res) => {
  const datos = await Telemetry.find().sort({ timestamp: -1 });

  const datosConvertidos = datos.map(d => ({
    _id: d._id,
    temp: d.temp,
    hum: d.hum,
    timestamp: toMexicoTime(d.timestamp),
    horaRecepcion: toMexicoTime(d.horaRecepcion),
    horaGuardado: toMexicoTime(d.horaGuardado),
    createdAt: toMexicoTime(d.createdAt),
    updatedAt: toMexicoTime(d.updatedAt),
    __v: d.__v
  }));

  res.json(datosConvertidos);
});


// -----------------------------------------------------
// GET: CONTADOR
// -----------------------------------------------------
app.get('/api/telemetry/count', async (req, res) => {
  const count = await Telemetry.countDocuments();
  res.json({ total_registros: count });
});


// -----------------------------------------------------
// HOME EN HORA LOCAL
// -----------------------------------------------------
app.get('/', async (req, res) => {
  const count = await Telemetry.countDocuments();
  const ahoraMX = toMexicoTime(new Date());

  res.send(`
    <h1>ESP32 Telemetría</h1>
    <p>🟢 API funcionando</p>
    <p><strong>Hora local MX:</strong> ${ahoraMX}</p>
    <p><strong>Total registros:</strong> ${count}</p>
    <p>POST: /api/telemetry</p>
  `);
});


// -----------------------------------------------------
// INICIAR SERVIDOR
// -----------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server iniciado en puerto ${PORT}`);
});
