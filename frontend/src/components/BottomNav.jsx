import { useNavigate } from 'react-router-dom';
import './BottomNav.css';

const NAV_ITEMS = [
  { id: 'home',        icon: 'home',       label: 'HOME',   path: '/' },
  { id: 'social',      icon: 'groups',     label: 'SQUAD',  path: '/social' },
  { id: 'leaderboard', icon: 'leaderboard',label: 'RANKS',  path: '/leaderboard' },
  { id: 'stats',       icon: 'analytics',  label: 'INTEL',  path: '/stats' },
  { id: 'profile',     icon: 'person',     label: 'PROFILE',path: '/profile' },
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
          {active === item.id && <span className="bottom-nav-glow" />}
          <span className="material-symbols-outlined bottom-nav-icon"
            style={active === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {item.icon}
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
