require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Telemetry = require('./models/Telemetry');

const app = express();

app.use(cors());
app.use(express.json());

// ---------- CONEXIÓN A MONGO ----------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado correctamente'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// ---------- POST: RECIBIR DATOS DEL ESP32 ----------
app.post('/api/telemetry', async (req, res) => {
  try {
    const { temp, hum, timestamp } = req.body;

    if (temp === undefined || hum === undefined || !timestamp) {
      return res.status(400).json({ error: 'Faltan campos: temp, hum o timestamp' });
    }

    const fecha = new Date(timestamp);
    if (isNaN(fecha.getTime())) {
      return res.status(400).json({ error: 'Timestamp inválido' });
    }

    const nuevoDato = new Telemetry({
      temp,
      hum,
      timestamp: fecha
    });

    await nuevoDato.save();

    console.log(`Dato guardado correctamente → ${temp}°C | ${hum}% | ${timestamp}`);

    res.status(201).json({
      message: 'Dato guardado correctamente',
      id: nuevoDato._id
    });

  } catch (err) {
    console.error('❌ Error guardando dato:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- GET: LISTAR TODOS LOS DATOS ----------
app.get('/api/telemetry', async (req, res) => {
  const datos = await Telemetry.find().sort({ timestamp: -1 });
  res.json(datos);
});

// ---------- GET: CONTADOR ----------
app.get('/api/telemetry/count', async (req, res) => {
  const count = await Telemetry.countDocuments();
  res.json({ total_registros: count });
});

// ---------- HOME ----------
app.get('/', async (req, res) => {
  const count = await Telemetry.countDocuments();
  res.send(`
    <h1>ESP32 Telemetría</h1>
    <p>🟢 API funcionando</p>
    <p><strong>Total registros:</strong> ${count}</p>
    <p>POST: /api/telemetry</p>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server iniciado en puerto ${PORT}`);
});
