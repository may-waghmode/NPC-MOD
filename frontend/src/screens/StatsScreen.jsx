import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import SkillRing from '../components/SkillRing';
import AppIcon from '../components/AppIcon';
import { usePlayer } from '../hooks/usePlayer';
import { mockWeeklyXP, mockSkills, mockAchievements } from '../data/mockData';
import './StatsScreen.css';

const ACHIEVEMENT_ICONS = { moon: 'moon', trophy: 'trophy', medal: 'medal', fire: 'fire' };

export default function StatsScreen() {
  const { player, loading } = usePlayer();
  
  // Weekly XP and skills still use mock data until backend provides these endpoints
  const weeklyXP = mockWeeklyXP;
  const skills = mockSkills;
  const achievements = mockAchievements;
  const maxXP = Math.max(...weeklyXP.map(d => d.xp));

  if (loading || !player) {
    return (
      <div className="screen stats-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 11 }}>// LOADING STATS...</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="screen stats-screen">
      <div className="stats-header">
        <div>
          <h1 className="screen-title">Player Stats</h1>
          <p className="stats-subtitle">// {player.class || 'Digital Alchemist'}</p>
        </div>
        <div className="stats-streak">
          <AppIcon name="fire" size={20} color="var(--accent-chaos)" />
          <div>
            <span className="font-game streak-number">{player.streak}</span>
            <span className="streak-text">Day Streak</span>
          </div>
        </div>
      </div>

      {/* Level banner */}
      <motion.div className="stats-level-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="stats-level-badge">
          <span className="font-game stats-level-num">{player.level}</span>
          <span className="stats-level-label">LEVEL</span>
        </div>
        <div className="stats-level-info">
          <p className="stats-level-class">{player.class}</p>
          <p className="stats-total-quests">{player.totalQuestsCompleted} Quests Completed</p>
          <p className="stats-total-xp font-mono">{(player.totalXpEarned || player.xp || 0).toLocaleString()} Total XP</p>
        </div>
      </motion.div>

      {/* XP Chart */}
      <div className="stats-section">
        <div className="section-header">
          <div className="section-title-row">
            <AppIcon name="chart" size={11} color="var(--text-dim)" />
            <span className="section-title">XP This Week</span>
          </div>
          <span className="stats-total-week font-mono">
            {weeklyXP.reduce((s, d) => s + d.xp, 0).toLocaleString()} XP
          </span>
        </div>
        <div className="xp-chart card">
          {weeklyXP.map((day, i) => (
            <motion.div key={day.day} className="xp-bar-col" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="xp-bar-wrap">
                <motion.div
                  className="xp-bar-fill"
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.xp / maxXP) * 100}%` }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
                  title={`${day.xp} XP`}
                />
              </div>
              <span className="xp-bar-day">{day.day}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Skill Rings */}
      <div className="stats-section">
        <div className="section-header">
          <div className="section-title-row">
            <AppIcon name="global" size={11} color="var(--text-dim)" />
            <span className="section-title">Skill Trees</span>
          </div>
        </div>
        <div className="skills-grid">
          {skills.map((skill, i) => (
            <motion.div key={skill.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <SkillRing skill={skill} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="stats-section">
        <div className="section-header">
          <div className="section-title-row">
            <AppIcon name="trophy" size={11} color="var(--text-dim)" />
            <span className="section-title">Achievements</span>
          </div>
        </div>
        {achievements.map((ach, i) => (
          <motion.div key={ach.id} className="achievement-card card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
            <div className="achievement-icon-wrap">
              <AppIcon name={ACHIEVEMENT_ICONS[ach.icon] || 'medal'} size={20} color="var(--accent-xp)" />
            </div>
            <div className="achievement-info">
              <p className="achievement-title">{ach.title}</p>
              <p className="achievement-desc">{ach.description}</p>
            </div>
            <span className="achievement-date">{ach.unlockedAt}</span>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
