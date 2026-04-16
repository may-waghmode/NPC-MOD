# NPC Mode ⚔️

> **Stop being an NPC. Level up your life.**

**NPC Mode** is an AI-powered life gamification mobile web app that turns your daily routines and chores into RPG quests. The app generates personalized daily quests based on your habits, allowing you to earn XP, level up your character, tackle weekly bosses, and challenge friends to duels. It features a brutal, tactical game-developer UI aesthetic built with React, Vite, and Firebase.

## 🌟 Key Features

- **AI Quest Master:** Generates perfectly balanced daily quests using Google's Gemini AI engine.
- **Character Progression:** Earn XP for completing real-life tasks. Track your level and category-specific skill trees (Fitness, Mind, Social, etc.).
- **Weekly Boss Battles:** Overcome massive weekly goals (like "Workout 5 times") disguised as menacing Boss Battles.
- **Social Duels:** Challenge your allies to complete quests. Hold each other accountable.
- **Demons & Avoidance:** Skipping too many quests triggers negative behavior trackers, making the quests harder.
- **Cross-Platform:** Built as a Progressive Web App (PWA) with native-like UI, easily packaged for Android using Capacitor.

## 🏗️ Architecture

The app is structured as a monorepo with two main components:

- **`/frontend`**: React 18, Vite, Framer Motion, and React Router. Connects via an Axios client wrapper to securely communicate with the backend. Styled with custom, brutally sharp, unrounded CSS.
- **`/backend`**: Node.js + Express. Uses Firebase Admin SDK for authentication and Firestore for data persistence. Incorporates Google's Gemini AI to analyze user intent and construct dynamically tailored quests.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Firebase account with a Firestore Database and Authentication (Google Sign-In) configured
- Gemini API Key

### Configuration

You need to establish environment files for both the frontend and backend.

1. **Backend `.env`**
   Create a `.env` in the `/backend` directory based on `.env.example`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Fill out your Firebase Admin keys and Gemini AI API key.

2. **Frontend `.env`**
   Create a `.env` in the `/frontend` directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   VITE_API_URL=http://localhost:3000/api
   ```

### Running Locally

Open two separate terminal windows.

**Terminal 1 — API Server:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend App:**
```bash
cd frontend
npm install
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

## 📱 Mobile Build (Capacitor)

To compile the native Android application:
```bash
cd frontend
npm run build
npx cap sync
npx cap open android
```
*Note: Android Studio is required to compile and run the emitted native project.*

## 🎨 Design System

**"Brutal v3"**
This application deliberately avoids rounded corners. It utilizes a high-contrast, tactical dark mode (`var(--bg-base): #08090E`) with striking neon accents (`#00FF94` for success, `#FF2D3B` for danger, `#FFB800` for XP) inspired by game development overlays and gritty sci-fi heads-up displays.
