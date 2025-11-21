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
      type: Date,          // Hora enviada por el ESP32
      required: true,
    },
    horaRecepcion: {
      type: Date,          // Hora en la que el servidor recibió el dato
      required: true,
    },
    horaGuardado: {
      type: Date,          // Hora exacta guardada en Mongo
      required: true,
    }
  },
  {
    timestamps: true       // createdAt / updatedAt
  }
);

module.exports = mongoose.model('Telemetry', telemetrySchema);
