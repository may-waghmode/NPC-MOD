import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import './LoginScreen.css';

export default function LoginScreen() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, error } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch {
      // error is set in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-bg-glow" />

      <motion.div
        className="login-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-icon">🎮</span>
          <h1 className="font-game login-title">NPC MODE</h1>
          <p className="login-subtitle">Level up your real life</p>
        </div>

        {/* Tagline */}
        <p className="login-tagline">
          Every game gives you quests to escape real life.<br />
          <span className="text-gradient">We gave you quests to finally live it.</span>
        </p>

        {/* Auth Form */}
        <form className="login-form" onSubmit={handleEmailAuth}>
          {mode === 'register' && (
            <input
              type="text"
              className="input"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            className="input"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading}>
            {loading ? '...' : mode === 'register' ? '⚔️ Create Character' : '🎮 Enter the Game'}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <span>or</span>
        </div>

        {/* Google Sign In */}
        <button className="btn btn--ghost btn--full" onClick={loginWithGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        {/* Toggle */}
        <p className="login-toggle">
          {mode === 'login' ? (
            <>New player? <button className="login-toggle-btn" onClick={() => setMode('register')}>Create Account</button></>
          ) : (
            <>Already playing? <button className="login-toggle-btn" onClick={() => setMode('login')}>Sign In</button></>
          )}
        </p>

        {/* Error */}
        {error && <p className="login-error">⚠️ {error}</p>}

        {/* Demo mode */}
        <a href="/?demo=true" className="login-demo">Try Demo Mode →</a>
      </motion.div>
    </div>
  );
}
