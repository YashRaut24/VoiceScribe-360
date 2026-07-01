const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['doctor', 'patient'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  specialization: {
      type: String,
      required: function () { return this.userType === 'doctor'; }
  },
  licenseNumber: {
      type: String,
      required: function () { return this.userType === 'doctor'; }
  },
  dateOfBirth: {
      type: Date,
      required: function () { return this.userType === 'patient'; }
  },
  createdAt: { type: Date, default: Date.now }
});

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  duration: { type: Number, default: 30 },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });

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

medicalRecordSchema.index({ doctorId: 1, createdAt: -1 });
medicalRecordSchema.index({ patientId: 1, createdAt: -1 });

const loginSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loginTime: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String
});
loginSessionSchema.index({ userId: 1, loginTime: -1 });

const symptomLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symptomsText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SymptomLogSchema1 = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  symptomsText: {
    type: String,
    required: true
  },

  structuredData: {
    type: Object,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

SymptomLogSchema1.index({ userId: 1, createdAt: -1 });
const auditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userType: { type: String, enum: ['doctor', 'patient', 'admin'], required: true },
    action: {
        type: String,
        enum: [
            'LOGIN',
            'LOGOUT',
            'REGISTER',
            'VIEW_MEDICAL_RECORDS',
            'CREATE_MEDICAL_RECORD',
            'VIEW_APPOINTMENTS',
            'CREATE_APPOINTMENT',
            'VIEW_SYMPTOMS',
            'CREATE_SYMPTOM',
            'DELETE_SYMPTOM',
            'UPLOAD_AUDIO',
            'GENERATE_SOAP',
            'TOKEN_VERIFIED',
            'UPDATE_MEDICAL_RECORD',
        ],
        required: true
    },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    resourceType: { type: String, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = {
    User: mongoose.model('User', userSchema),
    Appointment: mongoose.model('Appointment', appointmentSchema),
    MedicalRecord: mongoose.model('MedicalRecord', medicalRecordSchema),
    LoginSession: mongoose.model('LoginSession', loginSessionSchema),
    SymptomLog: mongoose.model('SymptomLog', symptomLogSchema),
    SymptomLogDoctor: mongoose.model('SymptomLogDoctor', SymptomLogSchema1),
    AuditLog: mongoose.model('AuditLog', auditLogSchema)
};