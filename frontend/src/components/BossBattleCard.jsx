import { useNavigate } from 'react-router-dom';
import AppIcon from './AppIcon';
import './BossBattleCard.css';

export default function BossBattleCard({ boss }) {
  const navigate = useNavigate();
  const pct = (boss.progress / boss.total) * 100;

  return (
    <div className="boss-card" onClick={() => navigate('/quest/boss')}>
      <div className="boss-card__header">
        <div className="boss-card__badge">
          <AppIcon name="skull" size={14} color="var(--accent-danger)" />
          <span>Weekly Boss</span>
        </div>
        <span className="badge badge-xp">+{boss.xpReward} XP</span>
      </div>

      <div className="boss-card__name">{boss.name}</div>
      <div className="boss-card__desc">{boss.description}</div>

      <div className="boss-card__progress-section">
        <div className="boss-card__progress-labels">
          <span className="boss-progress-label">Sacrifice Progress</span>
          <span className="boss-progress-count">{boss.progress}/{boss.total} Quests</span>
        </div>
        <div className="boss-progress-track">
          <div className="boss-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="boss-card__footer">
        <span className="boss-timer">{boss.timeLeft} remaining</span>
        <button
          className="btn btn-danger btn-sm boss-fight-btn"
          onClick={e => { e.stopPropagation(); navigate('/quest/boss'); }}
        >
          <AppIcon name="swords" size={13} color="#fff" />
          Enter Battle
        </button>
      </div>
    </div>
  );
}
