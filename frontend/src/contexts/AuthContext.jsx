/**
 * AuthContext — Firebase Authentication state manager.
 * Provides: user, loading, login (Google), logout, idToken.
 * Also calls POST /api/auth/verify on first login to sync with backend.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
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
        // Verify with backend & check if new user
        try {
          const token = await firebaseUser.getIdToken();
          const { data } = await api.post('/auth/verify', { idToken: token });
          setIsNewUser(data.isNewUser);
        } catch (err) {
          console.warn('Backend verify failed (offline mode?):', err.message);
        }
      } else {
        setUser(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isNewUser, setIsNewUser, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
