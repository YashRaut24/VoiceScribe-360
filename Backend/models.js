const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['doctor', 'patient'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  specialization: { type: String, function() { return this.userType === 'doctor'; } },
  licenseNumber: { type: String, function() { return this.userType === 'doctor'; } },
  dateOfBirth: { type: Date, function() { return this.userType === 'patient'; } },
  createdAt: { type: Date, default: Date.now }
});

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  duration: { type: Number, default: 30 },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  voiceTranscription: String,
  soapNotes: {
    subjective: String,
    objective: String,
    assessment: String,
    plan: String
  },
  diagnosis: String,
  prescription: String,
  audioFileUrl: String,
  createdAt: { type: Date, default: Date.now }
});

const loginSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loginTime: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Appointment: mongoose.model('Appointment', appointmentSchema),
  MedicalRecord: mongoose.model('MedicalRecord', medicalRecordSchema),
  LoginSession: mongoose.model('LoginSession', loginSessionSchema)
};