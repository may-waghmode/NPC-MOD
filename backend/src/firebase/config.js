const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (projectId && privateKey && clientEmail) {
    // Fix common private key issues:
    // 1. Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    // 2. Remove wrapping quotes if present
    privateKey = privateKey.replace(/^["']|["']$/g, '');

    // 3. If key doesn't have PEM headers, add them
    if (!privateKey.includes('-----BEGIN')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
        storageBucket: `${projectId}.firebasestorage.app`,
      });
      console.log('✅ Firebase Admin initialized with service account');
    } catch (err) {
      console.warn('⚠️  Firebase credential error:', err.message);
      console.warn('   Starting without auth verification...');
      admin.initializeApp({ projectId });
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
  } else {
    console.warn('⚠️  Firebase credentials not set. Running in demo mode.');
    admin.initializeApp({ projectId: projectId || 'npc-mode-demo' });
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
