import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocial } from '../hooks/useSocial';
import { usePlayer } from '../hooks/usePlayer';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import './SocialScreen.css';

const CLASS_EMOJIS = { Warrior: '⚔️', Scholar: '📚', Social: '🗣️', Explorer: '🧭' };

export default function SocialScreen() {
  const { friends, incomingQuests, loading, assignQuest, addFriend, acceptIncomingQuest } = useSocial();
  const { player } = usePlayer();
  const [friendCode, setFriendCode] = useState('');
  const [addMsg, setAddMsg] = useState({ type: '', text: '' });
  const [showAssign, setShowAssign] = useState(null);
  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [sentMsg, setSentMsg] = useState('');

  const handleAddFriend = async () => {
    if (!friendCode.trim()) return;
    setAddMsg({ type: '', text: '' });
    try {
      const result = await addFriend(friendCode.trim());
      setAddMsg({ type: 'ok', text: `Added ${result.friend?.name || 'friend'}! 🎉` });
      setFriendCode('');
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to add friend';
      setAddMsg({ type: 'err', text: msg });
    }
  };

  const handleAssign = async (friendId, friendName) => {
    if (!questTitle.trim()) return;
    try {
      await assignQuest(friendId, questTitle, questDesc || `A challenge from ${player?.name || 'a friend'}!`, 50, 'social');
      setSentMsg(`⚔️ Quest sent to ${friendName}!`);
      setShowAssign(null);
      setQuestTitle('');
      setQuestDesc('');
      setTimeout(() => setSentMsg(''), 3000);
    } catch (err) {
      alert('Failed to send quest: ' + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div className="social-screen">
      <div className="social-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="page-title">◆ SQUAD_HUB</span>
        <ThemeToggle />
      </div>
      <div className="social-content">

      {/* Your Friend Code */}
      {player?.friendCode && (
        <div className="your-code-card">
          <span className="yc-label">Your Friend Code</span>
          <span className="yc-code font-game">{player.friendCode}</span>
          <span className="yc-hint">Share this code so friends can add you!</span>
        </div>
      )}

      {/* Add Friend */}
      <div className="add-friend-section">
        <h3 className="section-title">ADD OPERATIVE</h3>
        <div className="add-friend-row">
          <input
            className="input"
            placeholder="Enter friend code..."
            value={friendCode}
            onChange={e => setFriendCode(e.target.value.toUpperCase())}
            maxLength={8}
            style={{ flex: 1, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700 }}
          />
          <button className="btn btn--primary" onClick={handleAddFriend} disabled={!friendCode.trim()}>
            Add
          </button>
        </div>
        {addMsg.text && (
          <p className={`add-msg ${addMsg.type === 'err' ? 'add-msg--err' : 'add-msg--ok'}`}>
            {addMsg.type === 'err' ? '⚠️' : '✅'} {addMsg.text}
          </p>
        )}
      </div>

      {/* Sent confirmation */}
      <AnimatePresence>
        {sentMsg && (
          <motion.div
            className="sent-toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {sentMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming Challenges */}
      {incomingQuests.length > 0 && (
        <div className="incoming-section">
          <h3 className="section-title">INCOMING CHALLENGES ({incomingQuests.length})</h3>
          <div className="incoming-list">
            {incomingQuests.map(quest => (
              <motion.div key={quest.id} className="incoming-card" layout>
                <div className="ic-info">
                  <span className="ic-from">From: {quest.assignedByName || 'A Friend'}</span>
                  <h4 className="ic-title">{quest.title}</h4>
                  {quest.description && <p className="ic-desc">{quest.description}</p>}
                  <span className="ic-xp font-game">⚡ {quest.xp_reward || 50} XP</span>
                </div>
                <div className="ic-actions">
                  <button className="btn btn--primary btn--sm" onClick={() => acceptIncomingQuest(quest.id)}>
                    ✅ Accept
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <h3 className="section-title">SQUAD ({friends.length})</h3>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 32 }}>
          <div className="loading-dots"><span/><span/><span/></div>
        </div>
      ) : friends.length === 0 ? (
        <div className="empty-friends">
          <span style={{ fontSize: 36 }}>🤝</span>
          <p>No friends yet</p>
          <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Share your friend code to connect!</p>
        </div>
      ) : (
        <div className="friends-list">
          {friends.map((friend, i) => (
            <motion.div
              key={friend.friendId}
              className="friend-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="fc-left">
                <span className="fc-avatar">{CLASS_EMOJIS[friend.class] || '🧭'}</span>
                <div className="fc-info">
                  <span className="fc-name">{friend.name}</span>
                  <div className="fc-meta">
                    <span className="font-game" style={{ fontSize: 8, color: 'var(--xp-gold)' }}>LVL {friend.level}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{friend.title || ''}</span>
                    {friend.streak > 0 && <span style={{ fontSize: 11 }}>🔥{friend.streak}</span>}
                  </div>
                </div>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowAssign(friend)}>
                ⚔️ Challenge
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Assign Quest Modal */}
      <AnimatePresence>
        {showAssign && (
          <motion.div className="modal-overlay" onClick={() => setShowAssign(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal-box"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="modal-title">⚔️ Send {showAssign.name} a Quest!</h3>
              <p className="modal-subtitle">Challenge your friend to do something awesome</p>
              <input
                className="input"
                placeholder="Quest title (e.g. 'Talk to 3 strangers')"
                value={questTitle}
                onChange={e => setQuestTitle(e.target.value)}
                autoFocus
                style={{ marginTop: 16 }}
              />
              <textarea
                className="input"
                placeholder="Description (optional)"
                value={questDesc}
                onChange={e => setQuestDesc(e.target.value)}
                rows={3}
                style={{ marginTop: 8 }}
              />
              <div className="modal-actions">
                <button className="btn btn--ghost" onClick={() => setShowAssign(null)}>Cancel</button>
                <button
                  className="btn btn--primary"
                  style={{ flex: 1 }}
                  onClick={() => handleAssign(showAssign.friendId, showAssign.name)}
                  disabled={!questTitle.trim()}
                >
                  ⚔️ Send Quest
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>{/* end social-content */}
      <BottomNav active="social" />
    </div>
  );
}
