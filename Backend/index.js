const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const mongoSanitize = require('express-mongo-sanitize');

const errorHandler = require('./middleware/error.middleware');
const authRoutes = require('./auth');
const apiRoutes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(helmet());
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

        if (!origin || origin === allowedOrigin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voicescribe')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', generalLimiter, apiRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'VoiceScribe Backend is running' });
});

app.use(errorHandler);
app.set('trust proxy', 1);

if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            return res.redirect(301, `https://${req.header('host')}${req.url}`);
        }
        next();
    });
}
app.use(helmet());

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});