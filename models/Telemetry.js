const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema(
  {
    temp: {
      type: Number,
      required: true,
    },
    hum: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,      // Hora enviada por el ESP32
      required: true,
    },
    horaRecepcion: {
      type: Date,      // Hora en que el servidor recibe el dato
      required: true,
    },
    horaGuardado: {
      type: Date,      // Hora exacta guardada en Mongo
      required: true,
    },
    intervaloSegundos: {
      type: Number,    // Diferencia contra el último dato guardado
      required: false,
    }
  },
  {
    timestamps: true   // createdAt / updatedAt automáticos
  }
);

module.exports = mongoose.model('Telemetry', telemetrySchema);
