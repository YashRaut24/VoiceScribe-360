const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, LoginSession } = require('./models');

// Fallback JWT secret for development (replace with secure key in production)
const JWT_SECRET = process.env.JWT_SECRET || 'ab5ab79849f4661000f7a25fe309867ef50d70523007ff09f2bf297ab1006aadcbd38c32c0152f932ac96a701ad361f3cda51cc0520238983209086e9cb0766a';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
const {
  email,
  password,
  userType,
  firstName,
  lastName,
  phone,
  specialization,
  licenseNumber,
  dateOfBirth
} = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const userData = {
      email,
      password: hashedPassword,
      userType,
      firstName,
      lastName,
      phone
    };

    if (userType === 'doctor') {
      userData.specialization = specialization;
      userData.licenseNumber = licenseNumber;
    } else {
      userData.dateOfBirth = dateOfBirth;
    }

    const user = new User(userData);
    await user.save();

    const token = jwt.sign({ userId: user._id, userType: user.userType }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/registerPatient', async (req, res) => {
  console.log(req.body);
   try {
    const {
      email,
      password,
      userType,
      firstName,
      lastName,
      phone,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userData = {
      email,
      password: hashedPassword,
      userType,
      firstName,
      lastName,
      phone
    };

    const user = new User(userData);
    await user.save();

    const token = jwt.sign({ userId: user._id, userType: user.userType }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
  
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    const user = await User.findOne({ email, userType });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, userType: user.userType }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Store login session
    const loginSession = new LoginSession({
      userId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await loginSession.save();
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;