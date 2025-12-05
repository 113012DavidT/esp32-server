require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Telemetry = require('./models/Telemetry');

const app = express();

app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------------
// FUNCIÓN PARA CONVERTIR UTC → HORA LOCAL MÉXICO
// -----------------------------------------------------------------------------
function toMexicoTime(date) {
  return new Date(date).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour12: false
  });
}

// -----------------------------------------------------------------------------
// CONEXIÓN A MONGO
// -----------------------------------------------------------------------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado correctamente'))
  .catch(err => console.error('❌ Error MongoDB:', err));


// -----------------------------------------------------------------------------
// POST: RECIBIR DATOS DEL ESP32
// -----------------------------------------------------------------------------
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

    const horaRecepcion = new Date();

    // ----------------------------
    // 1️⃣ OBTENER ÚLTIMO REGISTRO
    // ----------------------------
    const ultimo = await Telemetry.findOne().sort({ createdAt: -1 });

    let intervaloSegundos = null;

    if (ultimo) {
      intervaloSegundos = Math.floor(
        (horaRecepcion - ultimo.horaRecepcion) / 1000
      );
    }

    // ----------------------------
    // 2️⃣ GUARDAR NUEVO REGISTRO
    // ----------------------------
    const nuevoDato = new Telemetry({
      temp,
      hum,
      timestamp: fechaESP,
      horaRecepcion,
      horaGuardado: new Date(),
      intervaloSegundos
    });

    await nuevoDato.save();

    console.log(
      `📩 Guardado: ${temp}°C | ${hum}% | Intervalo: ` +
      (intervaloSegundos !== null ? intervaloSegundos + "s" : "N/A (primer dato)")
    );

    res.status(201).json({
      message: 'Dato guardado correctamente',
      id: nuevoDato._id,
      intervaloSegundos,
      horaLocal: toMexicoTime(horaRecepcion)
    });

  } catch (err) {
    console.error("❌ Error POST /api/telemetry:", err);
    res.status(500).json({ error: err.message });
  }
});


// -----------------------------------------------------------------------------
// GET: LISTAR TODOS LOS DATOS
// -----------------------------------------------------------------------------
app.get('/api/telemetry', async (req, res) => {
  try {
    const datos = await Telemetry.find().sort({ timestamp: -1 });

    const datosConvertidos = datos.map(d => ({
      _id: d._id,
      temp: d.temp,
      hum: d.hum,
      intervaloSegundos: d.intervaloSegundos,
      timestamp: toMexicoTime(d.timestamp),
      horaRecepcion: toMexicoTime(d.horaRecepcion),
      horaGuardado: toMexicoTime(d.horaGuardado),
      createdAt: toMexicoTime(d.createdAt),
      updatedAt: toMexicoTime(d.updatedAt),
      __v: d.__v
    }));

    res.json(datosConvertidos);
  } catch (err) {
    console.error("❌ Error GET /api/telemetry:", err);
    res.status(500).json({ error: err.message });
  }
});


// -----------------------------------------------------------------------------
// GET: ÚLTIMO REGISTRO
// -----------------------------------------------------------------------------
app.get('/api/telemetry/last', async (req, res) => {
  try {
    const last = await Telemetry.findOne().sort({ createdAt: -1 });

    if (!last) {
      return res.status(404).json({ message: "No hay registros" });
    }

    res.json({
      id: last._id,
      temp: last.temp,
      hum: last.hum,
      intervaloSegundos: last.intervaloSegundos,

      enviado_por_esp: {
        utc: last.timestamp,
        mexico_utc_6: toMexicoTime(last.timestamp)
      },

      recibido_por_backend: {
        utc: last.horaRecepcion,
        mexico_utc_6: toMexicoTime(last.horaRecepcion)
      },

      guardado_en_mongo: {
        utc: last.horaGuardado,
        mexico_utc_6: toMexicoTime(last.horaGuardado)
      }
    });

  } catch (err) {
    console.error("❌ Error GET /api/telemetry/last:", err);
    res.status(500).json({ error: err.message });
  }
});


// -----------------------------------------------------------------------------
// GET: CONTADOR
// -----------------------------------------------------------------------------
app.get('/api/telemetry/count', async (req, res) => {
  try {
    const count = await Telemetry.countDocuments();
    res.json({ total_registros: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -----------------------------------------------------------------------------
// HOME
// -----------------------------------------------------------------------------
app.get('/', async (req, res) => {
  try {
    const count = await Telemetry.countDocuments();
    const ahoraMX = toMexicoTime(new Date());

    res.send(`
      <h1>ESP32 Telemetría</h1>
      <p>🟢 API funcionando</p>
      <p><strong>Hora local MX:</strong> ${ahoraMX}</p>
      <p><strong>Total registros:</strong> ${count}</p>
      <p>POST: /api/telemetry</p>
    `);

  } catch (err) {
    res.status(500).send("Error interno");
  }
});


// -----------------------------------------------------------------------------
// INICIAR SERVIDOR
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server iniciado en puerto ${PORT}`);
});
