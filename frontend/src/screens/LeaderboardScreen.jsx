import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import BottomNav from '../components/BottomNav';
import './LeaderboardScreen.css';

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function PodiumCard({ entry, rank }) {
  if (!entry) return null;
  return (
    <motion.div
      className={`lb-podium-card lb-podium-card--${rank}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.1 : rank === 2 ? 0 : 0.2 }}
    >
      <span className="lb-rank-crown">{RANK_MEDALS[rank]}</span>
      <span className="lb-podium-emoji">{entry.classEmoji || '🧭'}</span>
      <span className="lb-podium-name">{entry.name}</span>
      <span className="lb-podium-xp font-game">⚡{entry.xp.toLocaleString()}</span>
      <span className="lb-podium-level">LVL {entry.level}</span>
    </motion.div>
  );
}

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
      {entry.streak > 0 && <span className="lb-row-streak">🔥{entry.streak}</span>}
    </motion.div>
  );
}

export default function LeaderboardScreen() {
  const [tab, setTab] = useState('global');
  const { publicBoard, friendsBoard, loading, refetch } = useLeaderboard();

  const board = tab === 'global' ? publicBoard : friendsBoard;
  const top3 = board.slice(0, 3);
  const rest = board.slice(3);

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <div className="lb-screen">
      <div className="lb-header">
        <h1 className="lb-title font-game">🏆 LEADERBOARD</h1>
        <p className="lb-subtitle">Who's leveling up the fastest?</p>
      </div>

      {/* Tabs */}
      <div className="lb-tabs">
        <button
          className={`lb-tab ${tab === 'global' ? 'lb-tab--active' : ''}`}
          onClick={() => setTab('global')}
        >
          🌍 Global
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
            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <div className="lb-podium">
                {podiumOrder.map((entry, i) => (
                  <PodiumCard key={entry?.userId || i} entry={entry} rank={[2, 1, 3][i]} />
                ))}
              </div>
            )}

            {/* If less than 3 players, show all in list */}
            {top3.length < 3 && (
              <div className="lb-list">
                {board.map((entry, i) => (
                  <LeaderRow key={entry.userId} entry={entry} index={i} />
                ))}
              </div>
            )}

            {/* Rest of the list */}
            {rest.length > 0 && (
              <div className="lb-list">
                {rest.map((entry, i) => (
                  <LeaderRow key={entry.userId} entry={entry} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <div style={{ height: 90 }} />
      <BottomNav active="leaderboard" />
    </div>
  );
}
