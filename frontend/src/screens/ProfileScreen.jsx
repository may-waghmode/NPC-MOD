import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../hooks/usePlayer';
import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import './ProfileScreen.css';

const CLASS_DATA = {
  Warrior: { emoji: '⚔️', color: '#FF4757' },
  Scholar: { emoji: '📚', color: '#6C63FF' },
  Social: { emoji: '🗣️', color: '#FF6B9D' },
  Explorer: { emoji: '🧭', color: '#FF9F43' },
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { player } = usePlayer();

  const cls = CLASS_DATA[player?.class] || CLASS_DATA.Explorer;
  const xpTotal = (player?.xp || 0) + (player?.xpToNextLevel || 500);
  const xpPct = xpTotal > 0 ? Math.min(100, ((player?.xp || 0) / xpTotal) * 100) : 0;

  return (
    <div className="profile-screen">
      <div className="profile-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)' }}>◆ OPERATIVE_FILE</span>
        <ThemeToggle />
      </div>
      <div className="profile-content">

      {/* Character Card */}
      <motion.div
        className="prof-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="prof-card-header">
          <span>◆ OPERATIVE PROFILE // {player?.class || 'Explorer'}</span>
        </div>
        <div className="prof-card-body">
          <div className="prof-avatar">{cls.emoji}</div>
          <h2 className="prof-name">{player?.name || user?.displayName || user?.email?.split('@')[0] || 'Adventurer'}</h2>
          <div className="prof-level-row">
            <span className="font-game" style={{ fontSize: 10, color: 'var(--secondary-container)' }}>LEVEL {player?.level || 1}</span>
            <span className="prof-title-text">{player?.title || 'The Awakening'}</span>
          </div>

          <div className="prof-xp">
            <div className="xp-bar"><div className="xp-bar__fill" style={{ width: `${xpPct}%` }} /></div>
            <div className="prof-xp-labels">
              <span className="font-game" style={{ fontSize: 8 }}>{player?.xp || 0} XP</span>
              <span>{player?.xpToNextLevel || 500} to next level</span>
            </div>
          </div>

          {player?.tagline && <p className="prof-tagline">"{player.tagline}"</p>}

          <div className="prof-stats-row">
            <div className="prof-stat">
              <span className="prof-stat-val">{player?.questsCompleted || 0}</span>
              <span className="prof-stat-key">Quests</span>
            </div>
            <div className="prof-stat">
              <span className="prof-stat-val">🔥 {player?.streak || 0}</span>
              <span className="prof-stat-key">Streak</span>
            </div>
            <div className="prof-stat">
              <span className="prof-stat-val">{player?.completionRate || 0}%</span>
              <span className="prof-stat-key">Rate</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Friend Code */}
      {player?.friendCode && (
        <div className="prof-code-card">
          <span className="pcc-label">YOUR FRIEND CODE</span>
          <span className="pcc-code font-game">{player.friendCode}</span>
          <span className="pcc-hint">Share so friends can add you!</span>
        </div>
      )}

      {/* Goals */}
      {player?.goals?.length > 0 && (
        <div className="prof-section">
          <div className="section-header">YOUR GOALS</div>
          <div className="prof-goals">
            {player.goals.map((g, i) => (
              <span key={i} className="prof-goal-tag">✓ {g}</span>
            ))}
          </div>
        </div>
      )}

      {/* Account */}
      <div className="prof-section">
        <div className="section-header">ACCOUNT</div>
        <div className="prof-account-card">
          <div className="prof-acc-row">
            <span className="prof-acc-key">Email</span>
            <span className="prof-acc-val">{user?.email || 'N/A'}</span>
          </div>
          <div className="prof-acc-row">
            <span className="prof-acc-key">Class</span>
            <span className="prof-acc-val">{cls.emoji} {player?.class || 'Explorer'}</span>
          </div>
          <div className="prof-acc-row">
            <span className="prof-acc-key">Personality</span>
            <span className="prof-acc-val">{player?.personalityType || '—'}</span>
          </div>
          <div className="prof-acc-row">
            <span className="prof-acc-key">Energy Peak</span>
            <span className="prof-acc-val">{player?.energyPeak || '—'}</span>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button className="btn btn--ghost btn--full" style={{ marginTop: 20 }} onClick={logout}>
        🚪 Sign Out
      </button>

      </div>{/* end profile-content */}
      <BottomNav active="profile" />
    </div>
  );
}
