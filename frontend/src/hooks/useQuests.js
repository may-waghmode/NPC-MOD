/**
 * useQuests — fetches daily quests + boss from backend.
 * Provides accept (complete), skip, and refresh actions.
 * Falls back to mock data if API unavailable.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { mockQuests, mockBossBattle } from '../data/mockData';

// Map backend quest data to frontend format
function mapQuest(q) {
  const CATEGORY_ICONS = { fitness: 'dumbbell', growth: 'book', social: 'users', chaos: 'dice', boss: 'skull' };
  return {
    id: q.id,
    title: q.title,
    description: q.description || '',
    lore: q.whyItHelps || q.description || '',
    category: q.category || 'growth',
    icon: CATEGORY_ICONS[q.category] || 'book',
    xpReward: q.xpReward || 50,
    timeLeft: q.timeLeft || '6h 00m',
    difficulty: q.difficulty || (q.xpReward >= 100 ? 3 : q.xpReward >= 60 ? 2 : 1),
    accepted: q.status === 'accepted',
    status: q.status || 'active',
  };
}

function mapBoss(b) {
  if (!b) return null;
  return {
    id: b.id || 'boss-weekly',
    name: b.title || b.name || 'THE PROCRASTINATOR',
    description: b.description || '',
    xpReward: b.xpReward || 150,
    progress: b.progress || 0,
    total: b.total || 5,
    timeLeft: b.timeLeft || '2 days',
  };
}

export function useQuests() {
  const [quests, setQuests] = useState([]);
  const [bossBattle, setBossBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/quests/daily');
      setQuests((data.quests || []).map(mapQuest));
      setBossBattle(mapBoss(data.bossBattle));
    } catch (err) {
      console.warn('Quests API unavailable, using mock data:', err.message);
      setQuests(mockQuests);
      setBossBattle(mockBossBattle);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  const completeQuest = useCallback(async (questId, proof) => {
    try {
      const { data } = await api.post('/quests/complete', { questId, proof });
      // Remove from active quests
      setQuests(prev => prev.filter(q => q.id !== questId));
      return data; // { newXP, newLevel, leveledUp, hiddenQuestUnlocked }
    } catch (err) {
      console.warn('Complete quest API failed:', err.message);
      // Fallback: just remove locally
      setQuests(prev => prev.filter(q => q.id !== questId));
      return { newXP: 0, leveledUp: false };
    }
  }, []);

  const skipQuest = useCallback(async (questId) => {
    try {
      await api.post('/quests/skip', { questId });
    } catch (err) {
      console.warn('Skip quest API failed:', err.message);
    }
    setQuests(prev => prev.filter(q => q.id !== questId));
  }, []);

  const acceptQuest = useCallback((questId) => {
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, accepted: true } : q));
  }, []);

  return { quests, bossBattle, loading, error, refetch: fetchQuests, completeQuest, skipQuest, acceptQuest };
}
