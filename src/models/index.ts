import mongoose, { Schema, model, models } from 'mongoose';

const AppointmentSchema = new Schema({
  userId: { type: String, required: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String },
  clientPhone: { type: String },
  service: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  price: { type: Number },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const ClientSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  totalAppointments: { type: Number, default: 0 },
  lastVisit: { type: String },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const Appointment = models.Appointment || model('Appointment', AppointmentSchema);
export const Client = models.Client || model('Client', ClientSchema);
