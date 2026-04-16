import { useState } from 'react';
import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import FriendCard from '../components/FriendCard';
import ChallengeCard from '../components/ChallengeCard';
import AppIcon from '../components/AppIcon';
import { useSocial } from '../hooks/useSocial';
import { mockIncomingChallenge } from '../data/mockData';
import './SocialScreen.css';

export default function SocialScreen() {
  const { friends, loading, assignQuest } = useSocial();
  const [challenge, setChallenge] = useState(mockIncomingChallenge);
  const [challengeAccepted, setChallengeAccepted] = useState(false);
  const [assignedTo, setAssignedTo] = useState(null);

  const handleAssignQuest = async (friend) => {
    await assignQuest(friend.id, 'Custom Quest', 'A challenge from your ally!', 100);
    setAssignedTo(friend.username || friend.name);
    setTimeout(() => setAssignedTo(null), 2000);
  };

  if (loading) {
    return (
      <div className="screen social-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 11 }}>// LOADING ALLIES...</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="screen social-screen">
      <div className="social-header">
        <h1 className="screen-title">Guild &amp; Allies</h1>
        <button className="btn btn-ghost btn-sm">
          <AppIcon name="users" size={12} /> Add Ally
        </button>
      </div>

      {/* Incoming duel */}
      {!challengeAccepted && challenge && (
        <div className="social-section">
          <div className="section-header">
            <div className="section-title-row">
              <AppIcon name="swords" size={11} color="var(--accent-chaos)" />
              <span className="section-title" style={{ color: 'var(--accent-chaos)' }}>Incoming Duel</span>
            </div>
          </div>
          <ChallengeCard
            challenge={challenge}
            onAccept={() => setChallengeAccepted(true)}
            onDecline={() => setChallenge(null)}
          />
        </div>
      )}

      {challengeAccepted && (
        <motion.div className="challenge-accepted-notice" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <AppIcon name="swords" size={16} color="var(--accent-success)" />
          <div>
            <p style={{ fontWeight: 800, fontSize: 13 }}>Duel Accepted</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Wake up at 6 AM — you got this.</p>
          </div>
          <span className="badge badge-xp">+800 XP</span>
        </motion.div>
      )}

      {/* Assign toast */}
      {assignedTo && (
        <motion.div className="assign-toast" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <AppIcon name="send" size={11} /> Quest sent to {assignedTo}
        </motion.div>
      )}

      {/* Allies */}
      <div className="social-section">
        <div className="section-header">
          <div className="section-title-row">
            <AppIcon name="shield" size={11} color="var(--text-dim)" />
            <span className="section-title">Your Allies</span>
          </div>
          <span className="allies-count">{friends.length} active</span>
        </div>
        <div className="allies-list">
          {friends.map((friend, i) => (
            <motion.div key={friend.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <FriendCard friend={friend} onAssignQuest={handleAssignQuest} />
            </motion.div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
