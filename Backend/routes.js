const express = require('express');
const { Appointment, MedicalRecord, User, SymptomLog, SymptomLogDoctor } = require('./models');
const auth = require('./middleware/auth.middleware');
const axios = require('axios');
const { validate } = require('./middleware/validation.middleware');
const { createAppointmentSchema } = require('./validators/appointment.validator');
const { createMedicalRecordSchema } = require('./validators/medicalRecord.validator');
const { createSymptomSchema } = require('./validators/symptom.validator');
const requireRole = require('./middleware/role.middleware');
const upload = require('./middleware/upload.middleware');
const audit = require('./middleware/audit.middleware');
const router = express.Router();

router.get('/appointments', auth, audit('VIEW_APPOINTMENTS', 'Appointment'), async (req, res, next) => {
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
    next(error);
  }
});

router.post('/appointments', auth, requireRole('patient'), audit('CREATE_APPOINTMENT', 'Appointment'), validate(createAppointmentSchema), async (req, res, next) => {  try {
    const { doctorId, date, duration, notes } = req.body;

    const doctor = await User.findOne({ _id: doctorId, userType: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointment = new Appointment({
      doctorId,
      patientId: req.user.userId,
      date,
      duration,
      notes
    });
    
    await appointment.save();
    await appointment.populate('doctorId', 'firstName lastName specialization');
    await appointment.populate('patientId', 'firstName lastName');
    
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
});

router.patch('/appointments/:id/status', auth, requireRole('doctor'), async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            doctorId: req.user.userId
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.status = status;
        await appointment.save();

        await appointment.populate('doctorId', 'firstName lastName specialization');
        await appointment.populate('patientId', 'firstName lastName');

        res.json(appointment);
    } catch (error) {
        next(error);
    }
});

router.get('/medical-records', auth, audit('VIEW_MEDICAL_RECORDS', 'MedicalRecord'), async (req, res, next) => {  try {
    const query = req.user.userType === 'doctor' 
      ? { doctorId: req.user.userId }
      : { patientId: req.user.userId };
    
    const records = await MedicalRecord.find(query)
      .populate('doctorId', 'firstName lastName specialization')
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(records);
  } catch (error) {
    next(error);
  }
});

router.post('/medical-records', auth, requireRole('doctor'), audit('CREATE_MEDICAL_RECORD', 'MedicalRecord'), validate(createMedicalRecordSchema), async (req, res, next) => {  try {
    const { patientId, appointmentId, voiceTranscription, soapNotes, diagnosis, prescription, audioFileUrl } = req.body;
    const patient = await User.findOne({ _id: patientId, userType: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const record = new MedicalRecord({
        patientId,
        doctorId: req.user.userId,
        appointmentId,
        voiceTranscription,
        soapNotes,
        diagnosis,
        prescription,
        audioFileUrl
    });
    await record.save();
    await record.populate('patientId', 'firstName lastName');
    
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.patch(
    '/medical-records/:id',
    auth,
    requireRole('doctor'),
    audit('UPDATE_MEDICAL_RECORD', 'MedicalRecord'),
    async (req, res, next) => {
        try {
            const {
                diagnosis,
                prescription,
                soapNotes
            } = req.body;

            const record = await MedicalRecord.findOne({
                _id: req.params.id,
                doctorId: req.user.userId
            });

            if (!record) {
                return res.status(404).json({
                    message: 'Medical record not found'
                });
            }

            record.diagnosis = diagnosis;
            record.prescription = prescription;
            record.soapNotes = soapNotes;

            await record.save();

            res.json(record);

        } catch (error) {
            next(error);
        }
    }
);

router.post('/upload-audio', auth, requireRole('doctor'), audit('UPLOAD_AUDIO', 'MedicalRecord'), upload.single('audio'), async (req, res, next) => {    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No audio file uploaded' });
        }

        const audioUrl = `/uploads/${req.file.filename}`;

        res.status(201).json({
            audioUrl,
            filename: req.file.filename,
            size: req.file.size
        });
    } catch (error) {
        next(error);
    }
});

router.post('/generate-soap', auth, requireRole('doctor'), audit('GENERATE_SOAP', 'MedicalRecord'), async (req, res, next) => {    try {
        const { transcript } = req.body;

        if (!transcript || !transcript.trim()) {
            return res.status(400).json({ message: 'Transcript is required' });
        }

        const response = await axios.post('http://localhost:5000/generate-soap', {
            transcript
        });

        res.json(response.data);

    }catch (error) {
        if (error.response?.data) {
            error.message = 'SOAP generation failed';
        }

        next(error);
    }
});

router.post('/analyze-symptoms', auth, requireRole('patient'), audit('ANALYZE_SYMPTOMS', 'SymptomLog'), async (req, res, next) => {
    try {
        const { symptoms } = req.body;

        if (!Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({
                message: 'Symptoms array is required'
            });
        }

        const response = await axios.post('http://localhost:5000/analyze-symptoms', {
            symptoms
        });

        res.json(response.data);

    } catch (error) {
    if (error.response?.data) {
            error.message = 'Symptom analysis failed';
        }

        next(error);
    }
});

router.get('/doctors', auth,requireRole('patient'), async (req, res, next) => {
  try {
    const doctors = await User.find({ userType: 'doctor' })
      .select('firstName lastName specialization')
      .sort({ firstName: 1 });

    res.json(doctors);
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/stats', auth, requireRole('doctor'), async (req, res, next) => {
    try {
        const doctorId = req.user.userId;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);

        const [
            totalAppointments,
            totalRecords,
            upcomingAppointments,
            patientsThisMonth,
            recentRecords
        ] = await Promise.all([
            Appointment.countDocuments({ doctorId }),
            MedicalRecord.countDocuments({ doctorId }),
            Appointment.countDocuments({
                doctorId,
                date: { $gt: now },
                status: 'scheduled'
            }),
            Appointment.distinct('patientId', {
                doctorId,
                createdAt: { $gte: startOfMonth }
            }),
            MedicalRecord.find({ doctorId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('patientId', 'firstName lastName')
        ]);

        res.json({
            totalAppointments,
            totalRecords,
            upcomingAppointments,
            patientsThisMonth: patientsThisMonth.length,
            recentRecords
        });
    } catch (error) {
        next(error);
    }
});

router.get('/patients', auth, requireRole('doctor'), async (req, res, next) => {
  try {
    const patients = await User.find({ userType: 'patient' })
      .select('firstName lastName email')
      .sort({ firstName: 1 });

    res.json(patients);
  } catch (error) {
    next(error);
  }
});

router.get('/symptoms', auth, requireRole('patient'), audit('VIEW_SYMPTOMS', 'SymptomLog'), async (req, res, next) => {  try {
    const symptomLogs = await SymptomLogDoctor.find({ userId: req.user.userId })
      .select('_id symptomsText structuredData createdAt')
      .sort({ createdAt: -1 });

    res.json(symptomLogs);
  } catch (error) {
    next(error);
  }
});

router.post('/symptoms', auth, requireRole('patient'), audit('CREATE_SYMPTOM', 'SymptomLog'), validate(createSymptomSchema), async (req, res, next) => {  try {
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
    next(error);
  }
});

router.delete('/symptoms/:id', auth, requireRole('patient'), audit('DELETE_SYMPTOM', 'SymptomLog'), async (req, res, next) => {    try {
        const symptomLog = await SymptomLogDoctor.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!symptomLog) {
            return res.status(404).json({ message: 'Symptom log not found' });
        }

        await SymptomLogDoctor.deleteOne({ _id: req.params.id });

        res.json({ message: 'Symptom log deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
