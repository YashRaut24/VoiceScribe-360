const express = require('express');
const { Appointment, MedicalRecord, User, SymptomLog, SymptomLogDoctor } = require('./models');
const auth = require('./middleware/auth.middleware');
const axios = require('axios');
const { validate } = require('./middleware/validation.middleware');
const { createAppointmentSchema } = require('./validators/appointment.validator');
const { createMedicalRecordSchema } = require('./validators/medicalRecord.validator');
const { createSymptomSchema } = require('./validators/symptom.validator');

const router = express.Router();

router.get('/appointments', auth, async (req, res) => {
  try {
    const query = req.user.userType === 'doctor' 
      ? { doctorId: req.user.userId }
      : { patientId: req.user.userId };
    
    const appointments = await Appointment.find(query)
      .populate('doctorId', 'firstName lastName specialization')
      .populate('patientId', 'firstName lastName')
      .sort({ date: 1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/appointments', auth,validate(createAppointmentSchema), async (req, res) => {
  try {
    const { doctorId, patientId, date, duration, notes } = req.body;
    
    const appointment = new Appointment({
      doctorId,
      patientId,
      date,
      duration,
      notes
    });
    
    await appointment.save();
    await appointment.populate('doctorId', 'firstName lastName specialization');
    await appointment.populate('patientId', 'firstName lastName');
    
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/medical-records', auth,  async (req, res) => {
  try {
    const query = req.user.userType === 'doctor' 
      ? { doctorId: req.user.userId }
      : { patientId: req.user.userId };
    
    const records = await MedicalRecord.find(query)
      .populate('doctorId', 'firstName lastName specialization')
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/medical-records', auth,validate(createMedicalRecordSchema), async (req, res) => {
  try {
    const { patientId, appointmentId, voiceTranscription, soapNotes, diagnosis, prescription } = req.body;
    
    const record = new MedicalRecord({
      patientId,
      doctorId: req.user.userId,
      appointmentId,
      voiceTranscription,
      soapNotes,
      diagnosis,
      prescription
    });
    
    await record.save();
    await record.populate('patientId', 'firstName lastName');
    
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/doctors', auth, async (req, res) => {
  try {
    const doctors = await User.find({ userType: 'doctor' })
      .select('firstName lastName specialization')
      .sort({ firstName: 1 });

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/symptoms', auth, async (req, res) => {
  try {
    const symptomLogs = await SymptomLogDoctor.find({ userId: req.user.userId })
      .select('_id symptomsText structuredData createdAt')
      .sort({ createdAt: -1 });

    res.json(symptomLogs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/symptoms', auth,validate(createSymptomSchema), async (req, res) => {
  try {
    const { symptomsText } = req.body;

    let structuredData = null;

    try {
      const llmResponse = await axios.post("http://localhost:5000/extract", {
        symptoms: symptomsText,
      });

      console.log("LLM STRUCTURED DATA 👉", llmResponse.data);

      structuredData = llmResponse.data.structuredData;
    } catch (llmError) {
      console.error('LLM Service Error:', llmError.response?.data || llmError.message);
    }

    const symptomLog = new SymptomLogDoctor({
      userId: req.user.userId,
      symptomsText,
      structuredData
    });

    await symptomLog.save();

    res.status(201).json(symptomLog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
