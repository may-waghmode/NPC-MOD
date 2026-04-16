import { motion } from 'framer-motion';
import AppIcon from '../components/AppIcon';
import { useAuth } from '../contexts/AuthContext';
import './LoginScreen.css';

export default function LoginScreen() {
  const { login, error } = useAuth();

  return (
    <div className="login-screen">
      <div className="login-content">
        {/* Logo / Title */}
        <motion.div
          className="login-logo"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-icon-wrap">
            <AppIcon name="swords" size={40} color="var(--accent-primary)" />
          </div>
          <h1 className="login-title font-game">NPC MODE</h1>
          <p className="login-subtitle">// Stop being an NPC. Level up your life.</p>
        </motion.div>

        {/* Features */}
        <motion.div
          className="login-features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { icon: 'swords',  text: 'AI-generated daily quests' },
            { icon: 'chart',   text: 'Track your XP & level progress' },
            { icon: 'users',   text: 'Challenge friends to duels' },
            { icon: 'skull',   text: 'Defeat weekly boss battles' },
          ].map((f, i) => (
            <motion.div
              key={f.text}
              className="login-feature"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <AppIcon name={f.icon} size={14} color="var(--accent-primary)" />
              <span>{f.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Login Button */}
        <motion.div
          className="login-actions"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <button className="btn btn-primary btn-lg login-google-btn" onClick={login}>
            <svg width="18" height="18" viewBox="0 0 48 48" className="google-icon">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign in with Google
          </button>

          <button className="btn btn-ghost btn-lg login-demo-btn" onClick={() => window.location.href = '/?demo=true'}>
            <AppIcon name="gamepad" size={14} />
            Demo Mode (no login)
          </button>
        </motion.div>

        {error && (
          <motion.p className="login-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.p>
        )}

        <p className="login-footer">
          // Built for warriors, by warriors.
        </p>
      </div>
    </div>
  );
}
