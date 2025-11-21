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
      type: Date,
      required: true,     // Fecha enviada por el ESP32
    },
    horaRecepcion: {
      type: Date,          // Fecha en que el servidor recibe el POST
      required: true,
    },
    horaGuardado: {
      type: Date,          // Fecha exacta que se guarda en Mongo
      required: true,
    }
  },
  {
    timestamps: true        // crea createdAt y updatedAt automáticamente
  }
);

module.exports = mongoose.model('Telemetry', telemetrySchema);
