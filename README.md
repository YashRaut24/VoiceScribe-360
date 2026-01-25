# 🧠 VoiceScribe – Health Intelligence System

> **“Labs confirm diseases. Doctors experience diseases forming. Our system listens and preserves that knowledge.”**

---

## 📌 One-Line Summary

VoiceScribe is a healthcare intelligence platform that captures medical conversations, structures them into clinical records, and transforms anonymized symptom patterns into early health intelligence — **without replacing doctors or labs**.

---

## 🎯 Core Problem

Healthcare today loses **context**.

### What gets lost

* Patient forgets symptom history
* Doctor can’t listen and document together
* Clinics can’t see regional patterns
* Authorities detect outbreaks too late

### Why this happens

Human medical conversations are **unstructured**, but medical systems require **structured data**.

This gap causes:

* Doctor burnout
* Missed clinical details
* Poor continuity of care
* Delayed outbreak awareness

---

## 🧩 What VoiceScribe Solves

We solve healthcare problems at **three critical stages**:

| Stage        | Problem Solved                   |
| ------------ | -------------------------------- |
| Before Visit | Patient forgets symptom timeline |
| During Visit | Doctor wastes time typing        |
| After Visit  | Medical data becomes unused      |

VoiceScribe keeps **medical context alive across time**.

---

## 🔁 Complete End-to-End Flow

---

### 1️⃣ BEFORE VISIT — Patient Side (Symptom Timeline)

#### Problem

Patients cannot accurately remember:

* When symptoms started
* How they changed
* What improved or worsened them

Doctors heavily depend on this information.

#### Workflow

* Patient logs symptoms via **text or voice**
* System stores:

  * Symptom
  * Timestamp
  * Progression / frequency
* Over time, a **timeline** is built
* Before consultation, system generates:

  * Structured symptom summary
  * Pattern-based history

#### Outcome

* No guessing
* No memory loss
* Better clinical clarity

---

### 2️⃣ DURING VISIT — Doctor Side (VoiceScribe AI)

#### Problem

Doctor must simultaneously:

* Listen
* Ask questions
* Type notes
* Write prescriptions

This reduces attention and accuracy.

#### Workflow

1. Doctor opens app
2. Clicks **Start Consultation**
3. Doctor and patient speak naturally
4. System listens silently in background
5. Doctor clicks **Stop**
6. Within seconds, system generates:

   * SOAP notes
   * Structured prescription
   * Patient-friendly explanation
   * Follow-up instructions

Doctor can:

* Review
* Edit
* Approve

#### Outcome

* Documentation time: **5 minutes → 30 seconds**
* Better doctor–patient interaction
* Clean medical records

---

### 3️⃣ AFTER VISIT — Health Intelligence Layer

Once approved, structured data already exists.

#### 🔹 A. Individual Doctor Intelligence

Doctors can see:

* Common weekly cases
* Seasonal symptom trends
* Repeated complaints
* Treatment outcomes

Helps doctors prepare better and detect patterns early.

---

#### 🔹 B. Clinic / Hospital Intelligence

Hospitals can analyze:

* OPD overload trends
* Rising symptom categories
* Medicine demand
* Staff planning

Helps in:

* Resource planning
* Reduced chaos during spikes

---

#### 🔹 C. Community Health Intelligence (Optional)

With patient consent:

* Data is anonymized
* Identity completely removed
* Only symptom patterns remain

Examples:

* Area-level symptom spikes
* Time-based increases
* Age-group clustering

Enables:

* Early warning signals
* Preventive action
* Faster response

⚠️ No diagnosis
⚠️ No personal tracking
⚠️ No identity storage

Only **pattern visibility**.

---

## 🔐 Privacy by Design (Core Principle)

* Doctor always approves records
* Patient identity never shared
* Data used only in anonymized form
* No names in intelligence layer

System focuses on:

> **“What is happening?”**

not

> **“Who is affected?”**

---

## 🧠 Important Distinction

| System      | Role                                     |
| ----------- | ---------------------------------------- |
| Doctors     | Treat patients                           |
| Labs        | Confirm diseases                         |
| VoiceScribe | Preserve context & detect early patterns |

✅ We do NOT diagnose diseases

✅ We do NOT replace labs

We operate **before lab confirmation**, where current systems are blind.

---

## 🧩 Why This Project Matters

Today:

* Labs detect disease late
* Authorities react late
* Doctors work in isolation
* Data remains fragmented

With VoiceScribe:

* Symptoms captured early
* Conversations preserved
* Documentation automated
* Patterns visible in real time

Result:

* Better diagnosis
* Less burnout
* Early awareness
* Smarter healthcare

---

# 🏗️ Project Architecture

```
VOICESCRIBE-360
│
├── backend
│   ├── llm-service (Python)
│   │   ├── main.py
│   │   ├── llm.py
│   │   ├── requirements.txt
│   │   └── .env
│   │
│   ├── Node.js API
│   │   ├── models
│   │   ├── routes
│   │   ├── middleware.js
│   │   ├── auth.js
│   │   ├── index.js
│   │   ├── seed.js
│   │   └── .env
│
├── frontend (React + Vite)
│   ├── src
│   │   ├── components
│   │   ├── contexts
│   │   ├── services
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
└── README.md
```

---

# ⚙️ Tech Stack

### Frontend

* React (Vite)
* Context API
* Protected Routes
* Axios

### Backend

* Node.js
* Express.js
* MongoDB
* JWT Authentication

### AI / LLM Service

* Python
* FastAPI / Flask (as service)
* Google Gemini API

---

# 🧪 Environment Setup

## Backend (.env)

```
MONGODB_URI=mongodb://localhost:27017/voicescribe
JWT_SECRET=voicescribe_super_secret_key_2024_hackathon_gdg_ai
PORT=3000
NODE_ENV=development
GOOGLE_API_KEY=YOUR_API_KEY
```

---

# 🚀 Installation & Setup (From Scratch)

## 1️⃣ Prerequisites Installation

Install the following first:

| Tool    | Required       |
| ------- | -------------- |
| Node.js | v18+           |
| Python  | 3.10+          |
| MongoDB | Local or Atlas |
| Git     | Latest         |

---

## 2️⃣ Clone Repository

```bash
git clone https://github.com/your-username/voicescribe-360.git
cd voicescribe-360
```

---

## 3️⃣ Backend Setup (Node.js)

```bash
cd backend
npm install
```

Create `.env` file and add environment variables.

Start backend server:

```bash
npm run dev
```

Backend runs on:

```
http://localhost:3000
```

---

## 4️⃣ LLM Service Setup (Python)

```bash
cd backend/llm-service
python -m venv env
env\Scripts\activate   # Windows
# source env/bin/activate  # Mac/Linux

pip install -r requirements.txt
```

Add `.env` with Google API key.

Run LLM service:

```bash
python main.py
```

---

## 5️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# ✅ Final Running Services

| Service     | Port           |
| ----------- | -------------- |
| Frontend    | 5173           |
| Backend API | 3000           |
| LLM Service | 8000 (example) |
| MongoDB     | 27017          |

---

# 🧠 Final Memory Anchor

Whenever you forget what this project does, remember:

> **Before visit → we preserve memory**
> **During visit → we remove typing**
> **After visit → we create intelligence**

---

## 👨‍⚕️ Built for

* Doctors
* Clinics
* Hospitals
* Public health awareness systems

---

## 🚧 Current Status

* ✅ Core architecture ready
* ✅ Authentication system
* ✅ Doctor & patient dashboards
* 🔄 AI structuring improving
* 🔜 Advanced intelligence layer

---

## 📄 License

This project is developed for academic, hackathon, and research purposes.

---

**VoiceScribe — Listening where healthcare begins.**
