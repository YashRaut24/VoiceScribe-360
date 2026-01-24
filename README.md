# VoiceScribe-360

VoiceScribe AI is a healthcare intelligence system that converts doctor–patient conversations into structured clinical notes and prescriptions, while generating anonymized symptom patterns for early health insights — without replacing doctors or labs.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or connection string)
- Git

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VoiceScribe-360
   ```

2. **Quick Start (Windows)**
   ```bash
   # Run the automated setup script
   start.bat
   ```
   This will:
   - Install all dependencies
   - Create demo users
   - Start both backend and frontend servers

3. **Manual Setup**
   
   **Backend Setup:**
   ```bash
   cd Backend
   npm install
   npm run seed    # Create demo users
   npm run dev     # Start backend server
   ```
   
   **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev     # Start frontend server
   ```

### 🌐 Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

### 👥 Demo Accounts

**Doctor Account:**
- Email: `demo@doctor.com`
- Password: `demo123`

**Patient Account:**
- Email: `demo@patient.com`
- Password: `demo123`

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
- **Authentication:** JWT-based with bcrypt password hashing
- **Database:** MongoDB with Mongoose ODM
- **API Routes:** RESTful endpoints for auth, appointments, medical records
- **Models:** User, Appointment, MedicalRecord, LoginSession

### Frontend (React + Vite)
- **Framework:** React 19 with modern hooks
- **Routing:** React Router DOM
- **State Management:** Context API for authentication
- **Styling:** Custom CSS with responsive design
- **Icons:** Lucide React

## 🎯 Features

### For Doctors
- **Voice Consultation:** Record patient conversations with live transcription
- **SOAP Notes Generation:** Automatic structured clinical documentation
- **Patient Management:** View appointments and medical history
- **Dashboard:** Overview of practice statistics

### For Patients
- **Symptom Logging:** Natural voice/text symptom tracking
- **Timeline View:** Visual representation of health journey
- **Appointment Booking:** Schedule consultations with doctors
- **Medical Records:** Access to personal health records

### Core Technology
- **AI-Powered Transcription:** Real-time speech-to-text conversion
- **Clinical NLP:** Extract medical entities and generate structured notes
- **Privacy-First:** HIPAA-compliant data handling
- **Health Intelligence:** Pattern detection for early intervention

## 📁 Project Structure

```
VoiceScribe-360/
├── Backend/
│   ├── models.js          # Database schemas
│   ├── auth.js           # Authentication routes
│   ├── routes.js         # API endpoints
│   ├── middleware.js     # JWT authentication middleware
│   ├── seed.js          # Demo user creation
│   └── index.js         # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── services/     # API service layer
│   │   └── App.jsx      # Main app component
│   └── public/          # Static assets
└── start.bat           # Quick start script
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in the Backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/voicescribe
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
NODE_ENV=development
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use `npm start` for production
3. Configure MongoDB connection string
4. Set up reverse proxy (nginx/Apache)

### Frontend Deployment
1. Build the application: `npm run build`
2. Serve the `dist` folder
3. Configure API base URL for production

## 🧪 Testing

### Manual Testing
1. Start the application using `start.bat`
2. Login with demo accounts
3. Test voice recording functionality
4. Verify SOAP notes generation
5. Check patient symptom logging

### API Testing
Use tools like Postman or curl to test API endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@doctor.com","password":"demo123","userType":"doctor"}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project was built for GDG AI Hackathon 2.0.

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running locally
   - Check connection string in `.env`
   - Verify MongoDB service is started

2. **Port Already in Use**
   - Change PORT in backend `.env`
   - Kill existing processes on ports 3000/5173

3. **Demo Users Not Created**
   - Run `npm run seed` in Backend directory
   - Check MongoDB connection

4. **Frontend Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

### Support

For issues and questions:
1. Check the troubleshooting section
2. Review console logs for errors
3. Verify all dependencies are installed
4. Ensure MongoDB is running

---

**Built with ❤️ for GDG AI Hackathon 2.0**
