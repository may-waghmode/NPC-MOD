import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import './LeaderboardScreen.css';

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function LeaderRow({ entry, index }) {
  return (
    <motion.div
      className={`lb-row ${entry.isYou ? 'lb-row--you' : ''}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <span className={`lb-row-rank ${entry.rank <= 3 ? 'lb-row-rank--top' : ''} font-game`}>
        {RANK_MEDALS[entry.rank] || `#${entry.rank}`}
      </span>
      <span className="lb-row-emoji">{entry.classEmoji || '🧭'}</span>
      <div className="lb-row-info">
        <div className="lb-row-name">
          {entry.name}
          {entry.isYou && <span className="you-tag">(YOU)</span>}
        </div>
        <div className="lb-row-meta">
          <span>LVL {entry.level}</span>
          <span>·</span>
          <span>{entry.questsCompleted || 0} quests</span>
          {entry.streak > 0 && (
            <>
              <span>·</span>
              <span>🔥 {entry.streak}</span>
            </>
          )}
        </div>
      </div>
      <span className="lb-row-xp font-game">⚡{entry.xp.toLocaleString()}</span>
    </motion.div>
  );
}

export default function LeaderboardScreen() {
  const [tab, setTab] = useState('rank');
  const { publicBoard, friendsBoard, yourRank, totalPlayers, loading, refetch } = useLeaderboard();

  const board = tab === 'rank' ? publicBoard : friendsBoard;

  return (
    <div className="lb-screen">
      <div className="lb-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="lb-title" style={{ display: 'block' }}>◆ GLOBAL RANKS</span>
          <span className="lb-subtitle">Top Operatives</span>
        </div>
        <ThemeToggle />
      </div>
      <div className="lb-content">

      {/* Your Rank Badge */}
      {yourRank && tab === 'rank' && (
        <motion.div
          className="lb-your-rank"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="lb-your-rank-number font-game">#{yourRank}</div>
          <div className="lb-your-rank-label">
            Your rank out of <strong>{totalPlayers}</strong> players
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="lb-tabs">
        <button
          className={`lb-tab ${tab === 'rank' ? 'lb-tab--active' : ''}`}
          onClick={() => setTab('rank')}
        >
          📍 Your Rank
        </button>
        <button
          className={`lb-tab ${tab === 'friends' ? 'lb-tab--active' : ''}`}
          onClick={() => setTab('friends')}
        >
          👥 Friends
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 60 }}>
          <div className="loading-dots"><span /><span /><span /></div>
        </div>
      ) : board.length === 0 ? (
        <div className="lb-empty">
          <div className="lb-empty-icon">{tab === 'friends' ? '👥' : '🏆'}</div>
          <p className="lb-empty-text">
            {tab === 'friends'
              ? 'No friends yet!'
              : 'No players on the leaderboard yet.'}
          </p>
          <p className="lb-empty-hint">
            {tab === 'friends'
              ? 'Add friends using their friend code to see them here.'
              : 'Complete quests to earn XP and climb the ranks!'}
          </p>
          <button className="btn btn--primary btn--sm" style={{ marginTop: 16 }} onClick={refetch}>
            🔄 Refresh
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="lb-list">
              {board.map((entry, i) => (
                <LeaderRow key={entry.userId} entry={entry} index={i} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      </div>{/* end lb-content */}
      <BottomNav active="leaderboard" />
    </div>
  );
}
