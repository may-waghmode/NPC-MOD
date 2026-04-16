import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppIcon from './AppIcon';
import './LevelUpModal.css';

function spawnConfetti(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    r: Math.random() * 5 + 2,
    d: Math.random() * 2 + 1,
    color: ['#FFB800','#7B6FFF','#00FF94','#FF2D3B','#FF7A1A'][Math.floor(Math.random()*5)],
    tilt: Math.random() * 10 - 5,
    angle: Math.random() * 360,
  }));

  let frame;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r * 2.5);
      ctx.restore();
      p.y += p.d * 3;
      p.x += Math.sin(p.angle) * 0.8;
      p.angle += 2;
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
    });
    frame = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(frame);
}

export default function LevelUpModal({ isOpen, level, newTitle, xpGained, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    return spawnConfetti(canvasRef.current);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="levelup-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <canvas ref={canvasRef} className="levelup-canvas" />

          <motion.div
            className="levelup-content"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <AppIcon name="flash" size={32} color="var(--accent-xp)" />

            <div className="levelup-title font-game">Level Up</div>
            <div className="levelup-level font-game">{level}</div>

            <div className="levelup-info">
              <p className="levelup-subtitle">New rank unlocked</p>
              <div className="levelup-title-unlock">
                <span className="unlock-label">// New Title</span>
                <span className="unlock-title">{newTitle}</span>
              </div>
              <div className="levelup-xp-gained font-mono">+{xpGained.toLocaleString()} XP</div>
            </div>

            <motion.button
              className="btn btn-lg levelup-claim-btn"
              onClick={onClose}
              whileTap={{ scale: 0.96 }}
            >
              <AppIcon name="check" size={14} color="#000" />
              Claim Rewards
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
