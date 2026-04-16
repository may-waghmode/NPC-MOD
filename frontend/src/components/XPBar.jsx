import { motion } from 'framer-motion';
import './XPBar.css';

export default function XPBar({ current, max, animated = true }) {
  const pct = Math.min((current / max) * 100, 100);

  return (
    <div className="xpbar-wrap">
      <div className="xpbar-track">
        <motion.div
          className="xpbar-fill"
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
        <div className="xpbar-shine" />
      </div>
      <div className="xpbar-labels">
        <span className="xpbar-current">{current.toLocaleString()} XP</span>
        <span className="xpbar-max">{max.toLocaleString()} XP</span>
      </div>
    </div>
  );
}
