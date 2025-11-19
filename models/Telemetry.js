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
      required: true,
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Telemetry', telemetrySchema);
