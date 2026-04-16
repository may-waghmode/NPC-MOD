import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import QuestDetailScreen from './screens/QuestDetailScreen';
import SocialScreen from './screens/SocialScreen';
import StatsScreen from './screens/StatsScreen';
import ProfileScreen from './screens/ProfileScreen';

function AppRoutes() {
  const { user, loading } = useAuth();
  const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true';

  // Show nothing while Firebase checks auth state
  if (loading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <p className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 11 }}>// LOADING...</p>
      </div>
    );
  }

  // Not logged in and not demo mode → show login
  if (!user && !isDemo) {
    return (
      <div className="app-shell">
        <LoginScreen />
      </div>
    );
  }

  // Authenticated or demo mode → show app
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/quest/:id" element={<QuestDetailScreen />} />
        <Route path="/social" element={<SocialScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
