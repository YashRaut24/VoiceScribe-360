const express = require('express');
const { Appointment, MedicalRecord, User, SymptomLog } = require('./models');
const auth = require('./middleware');
const axios = require('axios');

const router = express.Router();

// Get appointments
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

// Create appointment
router.post('/appointments', auth, async (req, res) => {
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

// Get medical records
router.get('/medical-records', auth, async (req, res) => {
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

// Create medical record
router.post('/medical-records', auth, async (req, res) => {
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

// Get doctors (for patient booking)
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

// Create symptom log
router.post('/symptoms', auth, async (req, res) => {
  try {
    const { symptomsText } = req.body;

    const symptomLog = new SymptomLog({
      userId: req.user.userId,
      symptomsText
    });

    await symptomLog.save();
    res.status(201).json(symptomLog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
