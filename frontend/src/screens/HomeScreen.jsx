import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../hooks/usePlayer';
import { useQuests } from '../hooks/useQuests';
import { useMegaQuest } from '../hooks/useMegaQuest';
import { useNotifications } from '../hooks/useNotifications';
import BottomNav from '../components/BottomNav';
import LevelUpModal from '../components/LevelUpModal';
import ThemeToggle from '../components/ThemeToggle';
import './HomeScreen.css';

const CAT_COLORS = { fitness: '#00E5A0', growth: '#6C63FF', social: '#FF6B9D', chaos: '#FF9F43', boss: '#FF4757' };
const CAT_ICONS = { fitness: '💪', growth: '📚', social: '💬', chaos: '🎲', boss: '💀' };
const CLASS_EMOJIS = { Warrior: '⚔️', Scholar: '📚', Social: '🗣️', Explorer: '🧭' };

export default function HomeScreen() {
  const navigate = useNavigate();
  const { player, refetch: refetchPlayer } = usePlayer();
  const { quests, challenges, loading, completeQuest, skipQuest, acceptChallenge, refetch: refetchQuests } = useQuests();
  const { megaQuest, formattedTime, acceptMegaQuest } = useMegaQuest();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [levelUp, setLevelUp] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);

  // All quests now require photo proof — navigate to detail screen
  const handleComplete = (quest) => {
    navigate(`/quest/${quest.id}`, { state: { quest } });
  };

  const handleSkip = async (questId) => {
    await skipQuest(questId);
  };

  const handleAcceptChallenge = async (questId) => {
    await acceptChallenge(questId);
    refetchQuests();
  };

  const xpTotal = (player?.xp || 0) + (player?.xpToNextLevel || 500);
  const xpPercent = xpTotal > 0 ? Math.min(100, ((player?.xp || 0) / xpTotal) * 100) : 0;

  const getDots = (d) => {
    const n = d === 'hard' ? 3 : d === 'medium' ? 2 : 1;
    return Array.from({ length: 3 }, (_, i) => (
      <span key={i} className={`diff-dot ${i < n ? 'diff-dot--on' : ''}`} />
    ));
  };

  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <div className="home-screen">

      {/* ── Top App Bar ── */}
      <div className="home-topbar">
        <span className="home-topbar-title">NPC_MODE</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ThemeToggle />
          <div className="home-topbar-badge">
            {player && <span>LVL {player.level || 1}</span>}
            {(player?.streak || 0) > 0 && <span>🔥{player.streak}</span>}
          </div>
        </div>
      </div>

      {/* ── Content Wrapper ── */}
      <div className="home-content">

      {/* ── Notification Banner ── */}
      {unreadCount > 0 && (
        <motion.div
          className="notif-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
        >
          <span className="notif-banner-icon">🔔</span>
          <span className="notif-banner-text">
            {unreadCount} new update{unreadCount > 1 ? 's' : ''} from friends
          </span>
          <span className="notif-banner-arrow">{showNotifs ? '▲' : '▼'}</span>
        </motion.div>
      )}

      {/* ── Notification List ── */}
      <AnimatePresence>
        {showNotifs && unreadNotifs.length > 0 && (
          <motion.div
            className="notif-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {unreadNotifs.slice(0, 5).map((notif, i) => (
              <motion.div
                key={notif.id || i}
                className="notif-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="notif-item-icon">
                  {notif.type === 'challenge_completed' ? '⚔️' :
                   notif.type === 'challenge_received' ? '🎯' :
                   notif.type === 'challenge_declined' ? '❌' :
                   CAT_ICONS[notif.questCategory] || '⚡'}
                </span>
                <div className="notif-item-content">
                  <span className="notif-item-name">{notif.fromName}</span>
                  {notif.type === 'challenge_completed' ? (
                    <span> {notif.message}</span>
                  ) : notif.type === 'challenge_received' ? (
                    <span> {notif.message}</span>
                  ) : notif.type === 'challenge_declined' ? (
                    <span> {notif.message}</span>
                  ) : (
                    <>
                      {' completed '}
                      <span className="notif-item-quest">{notif.questTitle}</span>
                      {notif.xpEarned > 0 && (
                        <span className="notif-item-xp"> (+{notif.xpEarned} XP)</span>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Player Card ── */}
      {player && (
        <motion.div className="player-card" initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="pc-header">
            <span>◆ OPERATIVE PROFILE</span>
            <span style={{ marginLeft: 'auto' }}>{CLASS_EMOJIS[player.class] || '🧭'} {player.class || 'Explorer'}</span>
          </div>
          <div className="pc-body">
            <div className="pc-top">
              <div className="pc-avatar">{CLASS_EMOJIS[player.class] || '🧭'}</div>
              <div className="pc-info">
                <div className="pc-name">{player.name || 'Adventurer'}</div>
                <div className="pc-row">
                  <span className="pc-level font-game">LVL {player.level || 1}</span>
                  {(player.streak || 0) > 0 && (
                    <span className="pc-streak">🔥 {player.streak}</span>
                  )}
                  {player.title && <span className="pc-title">{player.title}</span>}
                </div>
              </div>
            </div>
            <div className="pc-xp">
              <div className="xp-bar"><div className="xp-bar__fill" style={{ width: `${xpPercent}%` }} /></div>
              <div className="pc-xp-labels">
                <span className="font-game" style={{ fontSize: 8 }}>{player.xp || 0} XP</span>
                <span>{player.xpToNextLevel || 500} to next lvl</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Challenge Quests from Friends ── */}
      {challenges && challenges.length > 0 && (
        <>
          <div className="section-header">
            FRIEND CHALLENGES ({challenges.length})
          </div>
          <div className="quest-list">
            {challenges.map((quest, i) => (
              <motion.div
                key={quest.id}
                className="quest-card challenge-card"
                style={{ '--cat-color': '#FF6B9D' }}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="qc-color-bar" style={{ background: 'linear-gradient(180deg, #FF6B9D, #FF4757)' }} />
                <div className="qc-content">
                  <div className="qc-top">
                    <span className="qc-badge" style={{ background: 'rgba(255,107,157,0.15)', color: '#FF6B9D' }}>
                      👤 From {quest.assignedByName || 'Friend'}
                    </span>
                    <span className="qc-xp font-game">⚡{quest.challengeXpReward || quest.xp_reward || 50}</span>
                  </div>
                  <h3 className="qc-title">{quest.title}</h3>
                  <p className="qc-desc">{quest.description}</p>
                  {quest.challengeXpReward && (
                    <p style={{ fontSize: 11, color: '#FF9F43', marginTop: 4 }}>
                      💰 {quest.challengeXpReward} XP wagered by {quest.assignedByName || 'friend'}
                    </p>
                  )}
                  <div className="qc-actions">
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={() => handleAcceptChallenge(quest.id)}
                    >
                      ⚔️ Accept Challenge
                    </button>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => handleSkip(quest.id)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* ── Mega Quest ── */}
      {megaQuest && (
        <motion.div
          className="mega-quest-card"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mq-card-header">
            <span>☠ BOSS BATTLE — ACTIVE</span>
            <span className="mq-timer font-game">{formattedTime}</span>
          </div>
          <div className="mq-card-body">
            <div className="mq-badge-row">
              <span className="mq-badge">⚡ MEGA QUEST</span>
              <span className="mq-xp font-game">⚡{megaQuest.xpReward || 400} XP</span>
            </div>
            <h3 className="mq-title">{megaQuest.title}</h3>
            <p className="mq-desc">{megaQuest.description_template || megaQuest.description}</p>
            <div className="mq-footer">
              <span className="mq-players">🌍 {megaQuest.participantCount || 0} players in</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>📸 Photo proof required</span>
            </div>
            {!megaQuest.accepted && (
              <button className="btn btn--danger btn--full" style={{ marginTop: 12 }} onClick={acceptMegaQuest}>
                ⚔️ ACCEPT BOSS BATTLE
              </button>
            )}
            {megaQuest.accepted && (
              <div style={{ marginTop: 12 }}>
                <div className="mq-accepted">✓ ACCEPTED — COMPLETE BEFORE TIMER EXPIRES</div>
                <button
                  className="btn btn--primary btn--full"
                  style={{ marginTop: 8 }}
                  onClick={() => navigate(`/quest/${megaQuest.id || 'mega'}`, { state: { quest: { ...megaQuest, id: megaQuest.id || 'mega', category: 'boss', xp_reward: megaQuest.xpReward || 400, proof_type: 'photo', proof_instructions: megaQuest.proof_instructions || 'Take a photo as evidence of conquering the boss battle!' } } })}
                >
                  📸 Submit Photo Proof
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Daily Quests ── */}
      <div className="section-header">
        TODAY'S QUESTS {quests.length > 0 && `(${quests.length})`}
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 40 }}>
          <div className="loading-dots"><span /><span /><span /></div>
        </div>
      ) : quests.length === 0 ? (
        <div className="empty-quests">
          <span style={{ fontSize: 40 }}>✨</span>
          <p style={{ fontWeight: 600 }}>No active quests</p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {player?.questsCompleted > 0
              ? 'All done! New quests generate tomorrow.'
              : 'Complete onboarding to get your first AI-generated quests!'}
          </p>
          <button className="btn btn--primary btn--sm" style={{ marginTop: 12 }} onClick={refetchQuests}>
            🔄 Refresh Quests
          </button>
        </div>
      ) : (
        <div className="quest-list">
          <AnimatePresence>
            {quests.map((quest, i) => {
              const cat = quest.category || 'growth';
              const color = CAT_COLORS[cat] || '#6C63FF';
              const isFriendQuest = quest.assignedBy && quest.assignedBy !== 'self' && quest.assignedBy !== 'system';
              return (
                <motion.div
                  key={quest.id}
                  className={`quest-card ${isFriendQuest ? 'challenge-card' : ''}`}
                  style={{ '--cat-color': color }}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0, padding: 0 }}
                  transition={{ delay: i * 0.06 }}
                  layout
                >
                  <div className="qc-color-bar" style={{ background: isFriendQuest ? 'linear-gradient(180deg, #FF6B9D, #FF4757)' : color }} />
                  <div className="qc-content">
                    <div className="qc-top">
                      <span className="qc-badge" style={{ background: `${color}20`, color }}>
                        {CAT_ICONS[cat]} {cat}
                      </span>
                      <div className="qc-right">
                        <div className="qc-dots">{getDots(quest.difficulty)}</div>
                        <span className="qc-xp font-game">⚡{quest.xp_reward || quest.xpReward || 50}</span>
                      </div>
                    </div>
                    {quest.assignedByName && (
                      <span className="qc-from-friend">👤 From {quest.assignedByName}
                        {quest.challengeXpReward ? ` • ${quest.challengeXpReward} XP wagered` : ''}
                      </span>
                    )}
                    <h3 className="qc-title">{quest.title}</h3>
                    <p className="qc-desc">{quest.description}</p>
                    {quest.estimated_minutes && (
                      <span className="qc-time">⏱️ ~{quest.estimated_minutes} min</span>
                    )}
                    <div className="qc-actions">
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => handleComplete(quest)}
                      >
                        📸 Photo Proof
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => handleSkip(quest.id)}>
                        Skip
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => navigate(`/quest/${quest.id}`, { state: { quest } })}
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      </div>{/* end home-content */}

      <BottomNav active="home" />

      <AnimatePresence>
        {levelUp && (
          <LevelUpModal
            level={levelUp.level}
            title={levelUp.title}
            onClose={() => { setLevelUp(null); refetchPlayer(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
