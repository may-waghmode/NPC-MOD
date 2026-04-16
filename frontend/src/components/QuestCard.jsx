import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppIcon from './AppIcon';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../data/mockData';
import './QuestCard.css';

const DIFFICULTY_LABEL = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
const DOT_COLOR = { 1: 'var(--accent-success)', 2: 'var(--accent-xp)', 3: 'var(--accent-danger)' };

export default function QuestCard({ quest, index = 0, onAccept, onDecline }) {
  const [animating, setAnimating] = useState(false);
  const color = CATEGORY_COLORS[quest.category] || 'var(--accent-primary)';
  const label = CATEGORY_LABELS[quest.category] || quest.category;

  const handleAccept = () => {
    setAnimating(true);
    setTimeout(() => { onAccept(quest); setAnimating(false); }, 300);
  };

  return (
    <motion.div
      className="quest-card"
      style={{ '--quest-color': color, '--dot-color': DOT_COLOR[quest.difficulty] }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ delay: index * 0.07 }}
      layout
    >
      {/* Header row */}
      <div className="quest-card__header">
        <div className="quest-card__icon-wrap">
          <AppIcon name={quest.icon} size={18} color={color} />
        </div>
        <div className="quest-card__meta">
          <span className={`badge badge-${quest.category} quest-card__category`}>{label}</span>
          <span className="quest-card__time">{quest.timeLeft}</span>
        </div>
        <div className="quest-card__xp">
          <span className="badge badge-xp">+{quest.xpReward} XP</span>
        </div>
      </div>

      {/* Content */}
      <div className="quest-card__title">{quest.title}</div>
      <div className="quest-card__desc">{quest.description}</div>

      {/* Difficulty */}
      <div className="quest-card__difficulty">
        <div className="difficulty-dots">
          {[1, 2, 3].map(d => (
            <div key={d} className={`difficulty-dot ${d <= quest.difficulty ? 'active' : ''}`} />
          ))}
        </div>
        <span className="difficulty-label">{DIFFICULTY_LABEL[quest.difficulty]}</span>
      </div>

      {/* Actions / Accepted state */}
      {!quest.accepted ? (
        <div className="quest-card__actions">
          <button className="btn btn-ghost btn-sm" onClick={() => onDecline(quest)}>Skip</button>
          <button
            className="btn btn-sm quest-accept-btn"
            style={{ background: color, color: '#000', border: 'none' }}
            onClick={handleAccept}
          >
            <AppIcon name="check" size={12} color="#000" />
            Accept Quest
          </button>
        </div>
      ) : (
        <div className="quest-card__accepted">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AppIcon name="check" size={13} color={color} />
            <span style={{ color }}>Quest Accepted</span>
          </div>
          <span className="badge badge-xp">+{quest.xpReward} XP</span>
        </div>
      )}
    </motion.div>
  );
}
