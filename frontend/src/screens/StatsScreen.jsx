import { motion } from 'framer-motion';
import { usePlayer } from '../hooks/usePlayer';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import './StatsScreen.css';

const CAT_COLORS = { fitness: '#00E5A0', growth: '#6C63FF', social: '#FF6B9D', chaos: '#FF9F43', boss: '#FF4757' };
const CAT_ICONS = { fitness: '💪', growth: '📚', social: '💬', chaos: '🎲', boss: '💀' };

export default function StatsScreen() {
  const { player, loading } = usePlayer();

  if (loading || !player) {
    return (
      <div className="stats-screen">
        <div className="stats-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="page-title">◆ INTEL READOUT</span>
          <ThemeToggle />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="loading-dots"><span/><span/><span/></div>
        </div>
        <BottomNav active="stats" />
      </div>
    );
  }

  const catStats = player.categoryStats || {};
  const weeklyXP = player.weeklyXP || [];
  const maxWeekXP = Math.max(...weeklyXP.map(d => d.xp), 1);
  const hasData = player.questsCompleted > 0;

  return (
    <div className="stats-screen">
      <div className="stats-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="page-title">◆ INTEL READOUT</span>
        <ThemeToggle />
      </div>
      <div className="stats-content">

      {/* Stat Cards */}
      <div className="stat-grid">
        {[
          { label: 'Total XP', value: player.xp || 0, color: 'var(--xp-gold)', icon: '⚡' },
          { label: 'Quests Done', value: player.questsCompleted || 0, color: 'var(--primary)', icon: '✅' },
          { label: 'Completion', value: `${player.completionRate || 0}%`, color: 'var(--success)', icon: '📈' },
          { label: 'Streak', value: player.streak || 0, color: 'var(--xp-gold)', icon: '🔥' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="stat-tile"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <span className="st-icon">{s.icon}</span>
            <span className="st-value font-game" style={{ color: s.color }}>{s.value}</span>
            <span className="st-label">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Behavior Insights */}
      {hasData && (player.strongestCategory || player.mostAvoidedCategory) && (
        <>
          <div className="section-header">BEHAVIOR INSIGHTS</div>
          <div className="insights-cards">
            {player.strongestCategory && (
              <div className="insight-card" style={{ borderLeftColor: CAT_COLORS[player.strongestCategory] || '#6C63FF' }}>
                <span className="insight-emoji">{CAT_ICONS[player.strongestCategory] || '💪'}</span>
                <div>
                  <span className="insight-title">Strongest Category</span>
                  <span className="insight-value" style={{ color: CAT_COLORS[player.strongestCategory] }}>{player.strongestCategory}</span>
                </div>
              </div>
            )}
            {player.mostAvoidedCategory && (
              <div className="insight-card" style={{ borderLeftColor: CAT_COLORS[player.mostAvoidedCategory] || '#FF9F43' }}>
                <span className="insight-emoji">😬</span>
                <div>
                  <span className="insight-title">Most Avoided</span>
                  <span className="insight-value" style={{ color: CAT_COLORS[player.mostAvoidedCategory] }}>{player.mostAvoidedCategory}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Weekly XP Chart */}
      {hasData && weeklyXP.length > 0 && (
        <>
          <div className="section-header">XP THIS WEEK</div>
          <div className="xp-chart-card">
            <div className="xp-chart-label">7-DAY XP HISTORY</div>
            <div className="xp-bars">
              {weeklyXP.map((d, i) => {
                const pct = maxWeekXP > 0 ? (d.xp / maxWeekXP) * 100 : 0;
                const isToday = i === weeklyXP.length - 1;
                return (
                  <div key={i} className="xp-bar-col">
                    <span className="xp-bar-val font-game">{d.xp > 0 ? d.xp : ''}</span>
                    <motion.div
                      className={`xp-bar-fill ${isToday ? 'xp-bar-fill--today' : ''}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, 4)}%` }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                    />
                    <span className={`xp-bar-day ${isToday ? 'xp-bar-day--today' : ''}`}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Category Breakdown */}
      {hasData && Object.keys(catStats).length > 0 && (
        <>
          <div className="section-header">QUEST BREAKDOWN</div>
          <div className="cat-breakdown">
            {Object.entries(catStats).map(([cat, stats]) => {
              const total = (stats.completed || 0) + (stats.skipped || 0);
              const pct = total > 0 ? Math.round(((stats.completed || 0) / total) * 100) : 0;
              const color = CAT_COLORS[cat] || '#6C63FF';
              return (
                <div key={cat} className="cat-row">
                  <div className="cat-label">
                    <span className="cat-icon">{CAT_ICONS[cat] || '📋'}</span>
                    <span className="cat-name">{cat}</span>
                  </div>
                  <div className="cat-bar-area">
                    <div className="cat-bar">
                      <motion.div
                        className="cat-bar-fill"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <span className="cat-pct">{pct}%</span>
                  </div>
                  <span className="cat-count">{stats.completed}/{total}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty State */}
      {!hasData && (
        <div className="stats-empty">
          <span style={{ fontSize: 48 }}>📊</span>
          <p style={{ fontWeight: 700, fontSize: 16 }}>No stats yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Complete some quests to see your progress!</p>
        </div>
      )}

      </div>{/* end stats-content */}
      <BottomNav active="stats" />
    </div>
  );
}
