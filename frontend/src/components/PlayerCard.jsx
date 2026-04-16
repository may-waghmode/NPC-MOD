import { motion } from 'framer-motion';
import AppIcon from './AppIcon';
import XPBar from './XPBar';
import './PlayerCard.css';

export default function PlayerCard({ player }) {
  const initials = player.name.slice(0, 2).toUpperCase();

  return (
    <div className="player-card">
      <div className="player-card__inner">
        <div className="player-avatar">
          <div className="player-avatar__ring" />
          <div className="player-avatar__circle">
            <span className="player-avatar__initials">{initials}</span>
          </div>
          <div className="player-online-dot" />
        </div>

        <div className="player-info">
          <div className="player-name-row">
            <span className="player-name">{player.name}</span>
            <div className="player-streak">
              <AppIcon name="fire" size={11} color="var(--accent-chaos)" />
              <span className="streak-count">{player.streak}</span>
            </div>
          </div>

          <div className="player-title-row">
            <span className="player-level-label">LVL</span>
            <span className="player-level">{player.level}</span>
            <span className="player-class">{player.class}</span>
          </div>

          <XPBar current={player.xp} max={player.maxXp} />
        </div>
      </div>
    </div>
  );
}
