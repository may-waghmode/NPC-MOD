import AppIcon from './AppIcon';
import './ChallengeCard.css';

export default function ChallengeCard({ challenge, onAccept, onDecline }) {
  const initials = challenge.from.slice(0, 2).toUpperCase();

  return (
    <div className="challenge-card">
      <div className="challenge-header">
        <div className="challenge-avatar">{initials}</div>
        <div className="challenge-meta">
          <div className="challenge-from-row">
            <span className="challenge-from">{challenge.from}</span>
            <span className="challenge-type-badge">
              <AppIcon name="swords" size={9} color="var(--accent-chaos)" /> {challenge.type}
            </span>
          </div>
          <span className="challenge-from-level">LVL {challenge.fromLevel}</span>
        </div>
        <span className="challenge-timer">{challenge.timeLimit}</span>
      </div>

      <div className="challenge-quest">
        <span className="challenge-quest-label">// Mission</span>
        <div className="challenge-quest-title">{challenge.questTitle}</div>
        <div className="challenge-quest-desc">{challenge.questDescription}</div>
      </div>

      <div className="challenge-footer">
        <span className="badge badge-xp">+{challenge.xpReward} XP</span>
        <div className="challenge-actions">
          <button className="btn btn-ghost btn-sm" onClick={onDecline}>Decline</button>
          <button className="btn btn-sm challenge-accept-btn" onClick={onAccept}>
            <AppIcon name="swords" size={12} color="#000" />
            Accept Duel
          </button>
        </div>
      </div>
    </div>
  );
}
