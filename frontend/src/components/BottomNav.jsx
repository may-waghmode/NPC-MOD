import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHome, HiUsers, HiChartBar, HiUser } from 'react-icons/hi';
import { HiOutlineHome, HiOutlineUsers, HiOutlineChartBar, HiOutlineUser } from 'react-icons/hi';
import { RiSunFill, RiMoonFill } from 'react-icons/ri';
import { useTheme } from '../hooks/useTheme';
import './BottomNav.css';

const NAV_ITEMS = [
  { path: '/',        label: 'Home',    Icon: HiHome,      OutlineIcon: HiOutlineHome },
  { path: '/social',  label: 'Social',  Icon: HiUsers,     OutlineIcon: HiOutlineUsers },
  { path: '/stats',   label: 'Stats',   Icon: HiChartBar,  OutlineIcon: HiOutlineChartBar },
  { path: '/profile', label: 'Profile', Icon: HiUser,      OutlineIcon: HiOutlineUser },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__inner">
        {NAV_ITEMS.map(({ path, label, Icon, OutlineIcon }) => {
          const isActive = location.pathname === path;
          return (
            <button key={path} className={`bottom-nav__item ${isActive ? 'active' : ''}`} onClick={() => navigate(path)} id={`nav-${label.toLowerCase()}`}>
              {isActive && (
                <motion.div layoutId="nav-active-bar" className="nav-active-bar" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
              )}
              {isActive ? <Icon className="nav-icon" /> : <OutlineIcon className="nav-icon" />}
              <span className="nav-label">{label}</span>
            </button>
          );
        })}
        <button className="bottom-nav__theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <RiSunFill size={15} /> : <RiMoonFill size={15} />}
        </button>
      </div>
    </nav>
  );
}
