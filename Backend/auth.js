const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, LoginSession } = require('./models');
const { validate } = require('./middleware/validation.middleware');
const { registerSchema, loginSchema } = require('./validators/auth.validator');
const audit = require('./middleware/audit.middleware');

const JWT_SECRET = process.env.JWT_SECRET;
const router = express.Router();
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
}

router.post('/register', validate(registerSchema), audit('REGISTER', 'User'), async (req, res, next) => {  try {
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
   
    next(error);
  }
});

router.post('/login', validate(loginSchema), audit('LOGIN', 'User'), async (req, res, next) => {  try {
    const { email, password, userType } = req.body;
    
    const user = await User.findOne({ email, userType });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, userType: user.userType }, JWT_SECRET, { expiresIn: '7d' });
    
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
    next(error);
  }
});

router.get('/verify', audit('TOKEN_VERIFIED', 'User'), async (req, res, next) => {    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                userType: user.userType,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    }catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError'
        ) {
            error.status = 401;
            error.message = 'Token is invalid or expired';
        }

        next(error);
    }
});

module.exports = router;