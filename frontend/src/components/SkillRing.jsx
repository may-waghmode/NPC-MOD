import { motion } from 'framer-motion';
import AppIcon from './AppIcon';
import './SkillRing.css';

export default function SkillRing({ skill }) {
  const size = 84;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (skill.percentage / 100) * circumference;

  return (
    <div className={`skill-ring-wrap ${skill.mostAvoided ? 'most-avoided' : ''}`}>
      <div className="skill-ring-svg-wrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--ring-track)" strokeWidth={strokeWidth} />
          <motion.circle
            cx={size/2} cy={size/2} r={radius}
            fill="none"
            stroke={skill.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        </svg>
        <div className="skill-ring-center">
          <AppIcon name={skill.icon} size={16} color={skill.color} />
          <span className="skill-ring-pct" style={{ color: skill.color }}>{skill.percentage}%</span>
        </div>
      </div>
      <div className="skill-ring-label">{skill.label}</div>
      {skill.mostAvoided && <div className="skill-ring-warning">// AVOIDED</div>}
    </div>
  );
}
