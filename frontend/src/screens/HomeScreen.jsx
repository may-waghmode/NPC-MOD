import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from '../components/PlayerCard';
import QuestCard from '../components/QuestCard';
import BossBattleCard from '../components/BossBattleCard';
import BottomNav from '../components/BottomNav';
import LevelUpModal from '../components/LevelUpModal';
import AppIcon from '../components/AppIcon';
import { usePlayer } from '../hooks/usePlayer';
import { useQuests } from '../hooks/useQuests';
import './HomeScreen.css';

export default function HomeScreen() {
  const { player, loading: playerLoading } = usePlayer();
  const { quests, bossBattle, loading: questsLoading, refetch, acceptQuest, skipQuest } = useQuests();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleAcceptQuest = (quest) => {
    acceptQuest(quest.id);
  };

  const handleDeclineQuest = (quest) => {
    skipQuest(quest.id);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const isLoading = playerLoading || questsLoading;

  if (isLoading) {
    return (
      <div className="screen home-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 11 }}>// LOADING QUESTS...</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="screen home-screen">
      {/* Header */}
      <div className="home-header">
        <div className="home-header__top">
          <div>
            <h1 className="home-greeting">// Good Evening</h1>
            <p className="home-subtext">Your destiny awaits, warrior.</p>
          </div>
          <button className="home-levelup-btn" onClick={() => setShowLevelUp(true)} title="Test Level Up">
            <span className="home-levelup-label">DEMO</span>
            <AppIcon name="flash" size={14} color="var(--accent-primary)" />
          </button>
        </div>
      </div>

      {/* Player Card */}
      {player && <PlayerCard player={player} />}

      {/* Daily Quests */}
      <div className="home-section">
        <div className="section-header" style={{ padding: '0 16px' }}>
          <div className="section-title-row">
            <AppIcon name="swords" size={12} color="var(--text-dim)" />
            <span className="section-title">Daily Quests</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleRefresh} disabled={refreshing}>
            <AppIcon name="refresh" size={12} />
            {refreshing ? 'Loading' : 'Refresh'}
          </button>
        </div>

        <motion.div layout>
          {quests.length > 0 ? quests.map((quest, i) => (
            <QuestCard key={quest.id} quest={quest} index={i} onAccept={handleAcceptQuest} onDecline={handleDeclineQuest} />
          )) : (
            <motion.div className="home-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AppIcon name="check" size={36} color="var(--accent-success)" />
              <p>All quests handled. Refresh for new orders.</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Boss */}
      {bossBattle && (
        <div className="home-section">
          <div className="section-header" style={{ padding: '0 16px' }}>
            <div className="section-title-row">
              <AppIcon name="skull" size={12} color="var(--accent-danger)" />
              <span className="section-title" style={{ color: 'var(--accent-danger)' }}>Weekly Boss</span>
            </div>
            <span className="boss-warning">URGENT</span>
          </div>
          <BossBattleCard boss={bossBattle} />
        </div>
      )}

      <div style={{ height: 16 }} />
      <BottomNav />

      <LevelUpModal
        isOpen={showLevelUp}
        level={player ? player.level + 1 : 2}
        newTitle="Novice Explorer"
        xpGained={1500}
        onClose={() => setShowLevelUp(false)}
      />
    </div>
  );
}
