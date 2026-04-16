import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import QuestDetailScreen from './screens/QuestDetailScreen';
import SocialScreen from './screens/SocialScreen';
import StatsScreen from './screens/StatsScreen';
import ProfileScreen from './screens/ProfileScreen';
import OnboardingScreen from './screens/OnboardingScreen';

function AppRoutes() {
  const { user, loading, isNewUser } = useAuth();
  const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true';

  if (loading) {
    return (
      <div className="app-shell loading-screen">
        <div className="loading-dots">
          <span></span><span></span><span></span>
        </div>
        <p className="font-game" style={{ color: 'var(--text-dim)', fontSize: 10 }}>LOADING...</p>
      </div>
    );
  }

  if (!user && !isDemo) {
    return (
      <div className="app-shell">
        <LoginScreen />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Routes>
        {isNewUser ? (
          <>
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="*" element={<Navigate to="/onboarding" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/quest/:id" element={<QuestDetailScreen />} />
            <Route path="/social" element={<SocialScreen />} />
            <Route path="/stats" element={<StatsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
