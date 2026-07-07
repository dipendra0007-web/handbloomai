import { createContext, useContext, useState, useEffect } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../hooks/useSocket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hb_session') || 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const saveSession = (user) => {
    if (user) {
      localStorage.setItem('hb_session', JSON.stringify(user));
      setCurrentUser(user);
    } else {
      localStorage.removeItem('hb_session');
      setCurrentUser(null);
    }
  };

  // ── Socket connection lifecycle ───────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    // Connect socket when logged in
    const socket = connectSocket(currentUser.uid);

    // Real-time profile sync: when our own profile is updated anywhere
    const onProfileUpdated = (updatedUser) => {
      if (updatedUser?.uid === currentUser.uid) {
        const merged = { ...updatedUser };
        delete merged.password;
        if (JSON.stringify(merged) !== JSON.stringify(currentUser)) {
          saveSession(merged);
        }
      }
    };

    // Admin blocked or deleted this account
    const onAccountBlocked = () => {
      saveSession(null);
      window.location.href = '/auth';
    };

    const onAccountDeleted = () => {
      saveSession(null);
      window.location.href = '/auth';
    };

    // Platform reset by admin
    const onPlatformReset = () => {
      if (currentUser.role !== 'admin') {
        saveSession(null);
        window.location.href = '/auth';
      }
    };

    socket.on('user:profileUpdated', onProfileUpdated);
    socket.on('account:blocked', onAccountBlocked);
    socket.on('account:deleted', onAccountDeleted);
    socket.on('platform:reset', onPlatformReset);

    return () => {
      socket.off('user:profileUpdated', onProfileUpdated);
      socket.off('account:blocked', onAccountBlocked);
      socket.off('account:deleted', onAccountDeleted);
      socket.off('platform:reset', onPlatformReset);
    };
  }, [currentUser?.uid]);

  // ── Heartbeat — keeps session alive and syncs DB changes ─────────────────
  useEffect(() => {
    if (!currentUser) return;
    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/auth/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: currentUser.uid,
            name: currentUser.name,
            avatarEmoji: currentUser.avatarEmoji || '🌸',
            avatar: currentUser.avatar || null,
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const updated = { ...data.user };
            delete updated.password;
            if (JSON.stringify(updated) !== JSON.stringify(currentUser)) {
              saveSession(updated);
            }
          }
        }
      } catch {}
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000); // Reduced to 10s — socket handles instant updates
    return () => clearInterval(interval);
  }, [currentUser?.uid]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const signup = async ({ name, username, email, password }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      saveSession(data);
      connectSocket(data.uid); // Connect socket immediately after signup
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      saveSession(data);
      connectSocket(data.uid); // Connect socket immediately after login
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (currentUser) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: currentUser.uid })
        });
      } catch {}
      disconnectSocket(); // Clean disconnect on logout
    }
    saveSession(null);
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid, ...updates })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile update failed');
      saveSession(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const followUser = async (targetUid) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser.uid, followedId: targetUid })
      });
      if (res.ok) {
        const currentFollowing = currentUser.following || [];
        const updatedFollowing = currentFollowing.includes(targetUid)
          ? currentFollowing.filter(id => id !== targetUid)
          : [...currentFollowing, targetUid];
        saveSession({ ...currentUser, following: updatedFollowing });
      }
    } catch {}
  };

  const blockUser = async (targetUid) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId: currentUser.uid, blockedId: targetUid })
      });
      if (res.ok) {
        const currentBlocked = currentUser.blockedUsers || [];
        const updatedBlocked = currentBlocked.includes(targetUid)
          ? currentBlocked.filter(id => id !== targetUid)
          : [...currentBlocked, targetUid];
        const updatedFollowing = (currentUser.following || []).filter(id => id !== targetUid);
        saveSession({ ...currentUser, blockedUsers: updatedBlocked, following: updatedFollowing });
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      error,
      setError,
      signup,
      login,
      logout,
      updateProfile,
      followUser,
      blockUser,
      isAdmin: currentUser?.role === 'admin',
      isLoggedIn: !!currentUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
