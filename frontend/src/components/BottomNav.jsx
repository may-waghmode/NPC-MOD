import { useNavigate } from 'react-router-dom';
import './BottomNav.css';

const NAV_ITEMS = [
  { id: 'home', icon: '🏠', label: 'Home', path: '/' },
  { id: 'social', icon: '👥', label: 'Social', path: '/social' },
  { id: 'leaderboard', icon: '🏆', label: 'Ranks', path: '/leaderboard' },
  { id: 'stats', icon: '📊', label: 'Stats', path: '/stats' },
  { id: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
];

export default function BottomNav({ active }) {
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-item ${active === item.id ? 'bottom-nav-item--active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
          {active === item.id && <span className="bottom-nav-glow" />}
        </button>
      ))}
    </nav>
  );
}
