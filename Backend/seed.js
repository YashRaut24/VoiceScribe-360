const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { User } = require('./models');

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voicescribe');
    console.log('Connected to MongoDB');

    // Check if demo users already exist
    const existingDoctorDemo = await User.findOne({ email: 'demo@doctor.com' });
    const existingPatientDemo = await User.findOne({ email: 'demo@patient.com' });

    if (existingDoctorDemo && existingPatientDemo) {
      console.log('Demo users already exist');
      process.exit(0);
    }

    // Create demo doctor
    if (!existingDoctorDemo) {
      const hashedPassword = await bcrypt.hash('demo123', 12);
      const demoDoctor = new User({
        email: 'demo@doctor.com',
        password: hashedPassword,
        userType: 'doctor',
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        phone: '+1-555-0123',
        specialization: 'general',
        licenseNumber: 'MD123456'
      });
      await demoDoctor.save();
      console.log('Demo doctor created');
    }

    // Create demo patient
    if (!existingPatientDemo) {
      const hashedPassword = await bcrypt.hash('demo123', 12);
      const demoPatient = new User({
        email: 'demo@patient.com',
        password: hashedPassword,
        userType: 'patient',
        firstName: 'John',
        lastName: 'Smith',
        phone: '+1-555-0124',
        dateOfBirth: new Date('1990-05-15')
      });
      await demoPatient.save();
      console.log('Demo patient created');
    }

    console.log('Demo users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo users:', error);
    process.exit(1);
  }
};

seedUsers();