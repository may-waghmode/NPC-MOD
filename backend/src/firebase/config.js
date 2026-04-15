const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Supports either GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON)
// or individual env vars for project ID, private key, and client email.
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (projectId && privateKey && clientEmail) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
      storageBucket: `${projectId}.firebasestorage.app`,
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
  } else {
    console.warn(
      '⚠️  Firebase credentials not found. Set FIREBASE_PROJECT_ID / FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL ' +
        'or GOOGLE_APPLICATION_CREDENTIALS env var.'
    );
    // Initialize without credentials for local development / demo with emulator
    admin.initializeApp({ projectId: projectId || 'npc-mode-demo' });
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
