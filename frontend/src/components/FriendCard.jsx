import AppIcon from './AppIcon';
import './FriendCard.css';

export default function FriendCard({ friend, onAssignQuest }) {
  const initials = friend.name.slice(0, 2).toUpperCase();

  return (
    <div className="friend-card">
      <div className="friend-avatar">
        <span className="friend-avatar__initials">{initials}</span>
        <div className={`friend-status-dot ${friend.status}`} />
      </div>

      <div className="friend-info">
        <div className="friend-name-row">
          <span className="friend-name">{friend.name}</span>
          <span className="friend-level font-mono">LVL {friend.level}</span>
        </div>
        <span className="friend-title">{friend.class}</span>
        <div className="friend-quest-row">
          <div className="quest-dot" style={{ background: friend.questColor }} />
          <span className="friend-quest-text">{friend.currentQuest}</span>
        </div>
      </div>

      <button className="btn btn-sm friend-assign-btn" onClick={() => onAssignQuest(friend)}>
        <AppIcon name="send" size={11} color="var(--accent-social)" />
        Assign
      </button>
    </div>
  );
}
