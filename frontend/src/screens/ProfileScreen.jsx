import { useState } from 'react';
import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import LevelUpModal from '../components/LevelUpModal';
import AppIcon from '../components/AppIcon';
import { usePlayer } from '../hooks/usePlayer';
import { useAuth } from '../contexts/AuthContext';
import './ProfileScreen.css';

const CLASS_ICON_MAP = { Warrior: 'swords', Scholar: 'book', Explorer: 'global', Social: 'users' };

const MENU_ITEMS = [
  { label: 'Notifications', icon: 'mail' },
  { label: 'Privacy',       icon: 'lock' },
  { label: 'Help & FAQ',    icon: 'help' },
];

export default function ProfileScreen() {
  const { player, loading } = usePlayer();
  const { user, logout } = useAuth();
  const [showLevelUp, setShowLevelUp] = useState(false);

  if (loading || !player) {
    return (
      <div className="screen profile-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 11 }}>// LOADING PROFILE...</p>
        <BottomNav />
      </div>
    );
  }

  const displayName = user?.displayName || player.name;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="screen profile-screen">
      <div className="profile-header">
        <h1 className="screen-title">Profile</h1>
        <button className="btn btn-ghost btn-sm">
          <AppIcon name="settings" size={13} /> Settings
        </button>
      </div>

      {/* Hero avatar */}
      <motion.div className="profile-hero" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-avatar-large">
          <div className="profile-avatar-ring" />
          <div className="profile-avatar-circle">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--r-xs)' }} />
            ) : (
              <span className="profile-avatar-initials">{initials}</span>
            )}
          </div>
        </div>
        <h2 className="profile-name">{displayName}</h2>
        <div className="profile-class-badge">
          <AppIcon name={CLASS_ICON_MAP[player.class] || 'swords'} size={13} />
          <span>LVL {player.level} — {player.class}</span>
        </div>
        <div className="profile-xp-display font-mono">{player.xp.toLocaleString()} / {player.maxXp.toLocaleString()} XP</div>
      </motion.div>

      {/* Stats row */}
      <div className="profile-stats-row">
        {[
          { label: 'Level',  value: player.level,                color: 'var(--accent-xp)',      icon: 'star' },
          { label: 'Streak', value: `${player.streak}d`,         color: 'var(--accent-chaos)',   icon: 'fire' },
          { label: 'Quests', value: player.totalQuestsCompleted,  color: 'var(--accent-success)', icon: 'check' },
        ].map(s => (
          <div key={s.label} className="profile-stat-item card">
            <AppIcon name={s.icon} size={18} color={s.color} />
            <span className="profile-stat-value font-mono" style={{ color: s.color }}>{s.value}</span>
            <span className="profile-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Demo */}
      <div className="profile-section">
        <p className="profile-section-title">// Demo Controls</p>
        <button className="btn btn-primary btn-lg" onClick={() => setShowLevelUp(true)}>
          <AppIcon name="flash" size={13} /> Trigger Level Up
        </button>
      </div>

      {/* Menu */}
      <div className="profile-section">
        <p className="profile-section-title">// Account</p>
        {MENU_ITEMS.map(item => (
          <div key={item.label} className="profile-menu-item card">
            <div className="profile-menu-item-left">
              <AppIcon name={item.icon} size={14} color="var(--text-secondary)" />
              <span>{item.label}</span>
            </div>
            <AppIcon name="back" size={12} color="var(--text-dim)" style={{ transform: 'rotate(180deg)' }} />
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <button className="btn btn-ghost btn-lg" style={{ color: 'var(--accent-danger)', borderColor: 'rgba(255,45,59,0.2)' }} onClick={logout}>
          <AppIcon name="logout" size={14} color="var(--accent-danger)" /> Log Out
        </button>
      </div>

      <BottomNav />
      <LevelUpModal isOpen={showLevelUp} level={player.level + 1} newTitle="Novice Explorer" xpGained={1500} onClose={() => setShowLevelUp(false)} />
    </div>
  );
}
