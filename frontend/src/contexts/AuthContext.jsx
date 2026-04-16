/**
 * AuthContext — Firebase Authentication state manager.
 * Supports: Google Sign-In + Email/Password registration.
 * Also calls POST /api/auth/verify on login to sync with backend.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState(null);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const token = await firebaseUser.getIdToken();
          const { data } = await api.post('/auth/verify', { idToken: token });
          setIsNewUser(data.isNewUser);
        } catch (err) {
          console.warn('Backend verify failed (offline mode?):', err.message || err);
        }
      } else {
        setUser(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  /** Google Sign-In */
  const loginWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /** Email/Password Sign-In */
  const loginWithEmail = async (email, password) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /** Email/Password Registration */
  const registerWithEmail = async (email, password, displayName) => {
    try {
      setError(null);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /** Sign Out */
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  /** Complete onboarding — update state */
  const completeOnboarding = () => {
    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isNewUser,
      error,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
