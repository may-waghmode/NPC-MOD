import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './LevelUpModal.css';

const CONFETTI_COLORS = ['#fe6b00', '#000000', '#a04100', '#191b26', '#fe6b00', '#dadada'];

function ConfettiPiece({ index }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 1.5;
  const size = 6 + Math.random() * 8;
  const shape = Math.random() > 0.5 ? '50%' : '2px';

  return (
    <div
      className="confetti-piece"
      style={{
        left: `${left}%`,
        width: size,
        height: size,
        background: color,
        borderRadius: shape,
        animationDelay: `${delay}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      }}
    />
  );
}

export default function LevelUpModal({ level, title, onClose }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {}, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <motion.div
      className="levelup-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Confetti */}
      <div className="confetti-container">
        {Array.from({ length: 50 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      {/* Golden Glow */}
      <div className="levelup-glow" />

      {/* Content */}
      <motion.div
        className="levelup-content"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
      >
        <span className="levelup-stars">⭐ ⭐ ⭐</span>
        <h1 className="font-game levelup-title">LEVEL UP!</h1>
        <p className="font-game levelup-level">LEVEL {level}</p>
        {title && <p className="levelup-badge">"{title}"</p>}
        <button className="btn btn--primary btn--lg mt-24" onClick={() => { setShow(false); onClose?.(); }}>
          CONTINUE
        </button>
      </motion.div>
    </motion.div>
  );
}
