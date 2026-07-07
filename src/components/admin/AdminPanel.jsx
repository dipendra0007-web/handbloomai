import React, { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Flower2, Tag, Users, Activity, ShieldCheck,
  Plus, Search, TrendingUp, TrendingDown, Package, RefreshCw,
  Settings, LogOut, Trash2, BarChart2, Shield, Gift, Calendar,
  MessageSquare, AlertTriangle, UserPlus, RotateCcw, Lock, Unlock, Eye,
  Radio, BadgeCheck
} from 'lucide-react';
import { FLOWER_TYPES, CATEGORIES, PRODUCTS_LIBRARY, REWARD_COUPONS } from '../../data/flowers';

const NAV_SECTIONS = [
  { title: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { title: 'Content', items: [
    { id: 'flowers', label: 'Flower Library', icon: Flower2 },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'products', label: 'Products & Store', icon: Package },
    { id: 'events', label: 'Events & Seasons', icon: Calendar },
  ]},
  { title: 'Users & Safety', items: [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'register', label: 'Register User', icon: UserPlus },
    { id: 'creator-hub', label: 'Creator Hub', icon: BadgeCheck },
    { id: 'live-streams', label: 'Live Streams', icon: Radio },
    { id: 'messages', label: 'Messages Audit', icon: MessageSquare },
    { id: 'coupons', label: 'Coupons', icon: Gift },
    { id: 'activity', label: 'Live Activity', icon: Activity },
    { id: 'moderation', label: 'Moderation', icon: ShieldCheck },
  ]},
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKLY_DATA = [65, 80, 45, 92, 78, 110, 95];

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, change, isUp, color }) {
  return (
    <div className="stat-card stat-card-green" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-card-icon" style={{ background: color + '22', color }}>{icon}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: isUp ? 'var(--clr-green)' : '#fca5a5' }}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {change}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ realUsers, activeUsers, onNav }) {
  const registeredToday = realUsers.filter(u => {
    return u.joinedAt && Date.now() - new Date(u.joinedAt).getTime() < 86400000;
  }).length;

  return (
    <div>
      <div className="admin-header">
        <div>
          <div className="admin-title">Dashboard Overview</div>
          <div className="admin-subtitle">Real-time platform analytics and statistics.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNav('users')}>
            <Users size={14} /> Manage Users
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNav('register')}>
            <UserPlus size={14} /> Register User
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard icon={<Users size={18} />} label="Total Users" value={realUsers.length} change={`+${registeredToday} today`} isUp color="var(--clr-green)" />
        <StatCard icon={<Activity size={18} />} label="Online Now" value={activeUsers.length} change="Live" isUp color="var(--clr-sky)" />
        <StatCard icon={<Flower2 size={18} />} label="Flower Types" value={FLOWER_TYPES.length} change="+3%" isUp color="var(--clr-lavender)" />
        <StatCard icon={<Shield size={18} />} label="Blocked Users" value={realUsers.filter(u => u.isBlocked).length} change="monitored" isUp={false} color="var(--clr-gold)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="chart-container">
          <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Weekly Growth</h4>
          <div className="bar-chart">
            {WEEKLY_DATA.map((val, i) => (
              <div key={i} className="bar-chart-bar-wrap">
                <div className="bar-chart-bar" style={{ height: `${(val / 120) * 100}%` }} />
                <span className="bar-chart-label">{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h4 style={{ fontWeight: 700, marginBottom: 16 }}>🟢 Online Right Now ({activeUsers.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {activeUsers.length === 0 && <p style={{ color: 'var(--clr-white-60)', fontSize: '0.82rem' }}>No active sessions detected.</p>}
            {activeUsers.map(u => (
              <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(134,239,172,0.05)', borderRadius: 10, border: '1px solid rgba(134,239,172,0.1)' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-sky))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', overflow: 'hidden' }}>
                  {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.avatarEmoji || '🌸'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--clr-green)' }}>🟢 {new Date(u.lastSeen).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Register User (Admin Creates Account) ────────────────────────────────────
function RegisterUser({ onRefresh }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !username || !email || !password) {
      setMsg('All fields are required.'); setIsError(true); return;
    }
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, role })
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || 'Failed to register.'); setIsError(true); }
      else {
        setMsg(`✅ User "${name}" registered successfully!`);
        setIsError(false);
        setName(''); setUsername(''); setEmail(''); setPassword('');
        onRefresh();
      }
    } catch {
      setMsg('Server error. Is the backend running?'); setIsError(true);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <div className="admin-title">Register New User</div>
          <div className="admin-subtitle">Create accounts directly from the admin panel.</div>
        </div>
      </div>
      <div className="glass-card" style={{ padding: 28, maxWidth: 560 }}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Luna Star" />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. lunastar" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: 10, marginTop: 12, fontSize: '0.82rem', background: isError ? 'rgba(252,165,165,0.1)' : 'rgba(134,239,172,0.1)', color: isError ? '#fca5a5' : 'var(--clr-green)', border: `1px solid ${isError ? 'rgba(252,165,165,0.3)' : 'rgba(134,239,172,0.3)'}` }}>
            {msg}
          </div>
        )}
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleRegister} disabled={loading}>
          <UserPlus size={16} /> {loading ? 'Registering...' : 'Register Account'}
        </button>
      </div>
    </div>
  );
}

// ─── User Management ─────────────────────────────────────────────────────────
function UserManagement({ realUsers, onRefresh }) {
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  const filtered = realUsers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (uid) => {
    try {
      await fetch(`/api/admin/users/${uid}`, { method: 'DELETE' });
      onRefresh();
      setConfirmDelete(null);
    } catch {}
  };

  const handleBlock = async (uid) => {
    try {
      await fetch(`/api/admin/users/${uid}/block`, { method: 'POST' });
      onRefresh();
    } catch {}
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <div className="admin-title">User Management</div>
          <div className="admin-subtitle">{realUsers.length} registered accounts — live from database.</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-white-60)' }} />
        <input className="form-input" style={{ paddingLeft: 42 }} placeholder="Search by name, email, or username..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Location</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const isExpanded = expandedUser === u.uid;
              return (
                <React.Fragment key={u.uid}>
                  <tr style={{ opacity: u.isBlocked ? 0.5 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', overflow: 'hidden', flexShrink: 0 }}>
                          {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.avatarEmoji || '🌸'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--clr-white-60)' }}>{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{u.email}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--clr-white-60)' }}>{u.location || '—'}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-legendary' : 'badge-common'}`}>{u.role}</span></td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>{u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, background: u.isBlocked ? 'rgba(252,165,165,0.15)' : 'rgba(134,239,172,0.1)', color: u.isBlocked ? '#fca5a5' : 'var(--clr-green)' }}>
                        {u.isBlocked ? '🔴 Blocked' : (u.isOnline ? '🟢 Online' : '⚪ Active')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="table-action-btn"
                          title="View Profile Details"
                          onClick={() => setExpandedUser(isExpanded ? null : u.uid)}
                          style={{ color: isExpanded ? 'var(--clr-green)' : 'var(--clr-white-80)' }}
                        >
                          <Eye size={13} />
                        </button>
                        {u.role !== 'admin' && (
                          <>
                            <button
                              className="table-action-btn"
                              title={u.isBlocked ? 'Unblock' : 'Block'}
                              onClick={() => handleBlock(u.uid)}
                              style={{ color: u.isBlocked ? 'var(--clr-green)' : 'var(--clr-gold)' }}
                            >
                              {u.isBlocked ? <Unlock size={13} /> : <Lock size={13} />}
                            </button>
                            <button
                              className="table-action-btn"
                              title="Delete"
                              onClick={() => setConfirmDelete(u)}
                            >
                              <Trash2 size={13} style={{ color: '#fca5a5' }} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan="7" style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                          <div>
                            <h5 style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--clr-green)', marginBottom: 6 }}>Gardener Biography</h5>
                            <p style={{ fontSize: '0.78rem', color: 'var(--clr-white-80)', lineHeight: 1.5, margin: 0 }}>
                              {u.bio || 'No biography written.'}
                            </p>
                            {u.hobbies && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                {u.hobbies.split(',').map(h => h.trim()).filter(Boolean).map((h, i) => (
                                  <span key={i} style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 6, color: 'var(--clr-green)' }}>🏷️ {h}</span>
                                ))}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: '0.75rem', color: 'var(--clr-white-60)' }}>
                              {u.website && (
                                <span>
                                  🔗 <a href={u.website} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-sky)' }}>{u.website}</a>
                                </span>
                              )}
                              <span>⭐ Level {u.level || 1} ({u.xp || 0} XP)</span>
                            </div>
                          </div>

                          <div>
                            <h5 style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--clr-green)', marginBottom: 6 }}>Connected Profiles</h5>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {u.instagram && (
                                <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 8, color: '#f472b6' }}>
                                  📸 {u.instagram}
                                </span>
                              )}
                              {u.twitter && (
                                <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, color: '#38bdf8' }}>
                                  🐦 {u.twitter}
                                </span>
                              )}
                              {u.github && (
                                <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#e2e8f0' }}>
                                  💻 {u.github}
                                </span>
                              )}
                              {u.youtube && (
                                <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171' }}>
                                  📺 YouTube
                                </span>
                              )}
                              {!u.instagram && !u.twitter && !u.github && !u.youtube && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>No social accounts linked.</span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)', marginTop: 12 }}>
                              👤 Following: {u.following?.length || 0} users · Blocked: {u.blockedUsers?.length || 0} users
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--clr-white-60)' }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="glass-card" style={{ padding: 32, maxWidth: 400, width: '90%', textAlign: 'center' }}>
            <AlertTriangle size={40} style={{ color: '#fca5a5', margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Delete User?</h3>
            <p style={{ color: 'var(--clr-white-60)', fontSize: '0.85rem', marginBottom: 24 }}>
              This will permanently delete <strong style={{ color: 'white' }}>{confirmDelete.name}</strong> and all their data including messages and follows.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(confirmDelete.uid)}>
                <Trash2 size={15} /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Messages Audit ───────────────────────────────────────────────────────────
function UserMessagesManager() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages');
      if (res.ok) setLogs(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      setLogs(l => l.filter(m => m.id !== id));
    } catch {}
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <div className="admin-title">Messages Audit Log</div>
          <div className="admin-subtitle">All user chats, photos, voice & call records — live database.</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadLogs}><RefreshCw size={14} /> Reload</button>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Sender</th><th>Receiver</th><th>Type</th><th>Content</th><th>Time</th><th>Action</th></tr></thead>
          <tbody>
            {logs.map(m => (
              <tr key={m.id}>
                <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{m.senderName}</td>
                <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{m.receiverName}</td>
                <td>
                  <span className={`badge ${m.type === 'call-recording' || m.type === 'call-invite' ? 'badge-legendary' : m.type === 'image' ? 'badge-rare' : m.type === 'voice' ? 'badge-epic' : 'badge-common'}`} style={{ fontSize: '0.65rem' }}>
                    {m.type.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  {m.type === 'image' && (
                    <img src={m.content} alt="" style={{ maxWidth: 80, maxHeight: 60, borderRadius: 8, border: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => window.open(m.content, '_blank')} />
                  )}
                  {m.type === 'voice' && (
                    <audio src={m.content} controls style={{ height: 26, maxWidth: 160 }} />
                  )}
                  {m.type === 'call-recording' && (
                    <video src={m.content} controls style={{ height: 60, maxWidth: 120, borderRadius: 8, background: '#000' }} />
                  )}
                  {m.type === 'text' && (
                    <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      {m.content}
                    </div>
                  )}
                  {(m.type === 'call-invite' || m.type === 'call-accept' || m.type === 'call-decline' || m.type === 'call-end') && (
                    <span style={{ fontSize: '0.72rem', fontStyle: 'italic', opacity: 0.8 }}>
                      {m.type === 'call-invite' ? '📞 Initiated Call' : m.type === 'call-accept' ? '🟢 Answered' : m.type === 'call-decline' ? '🔴 Declined' : '📞 Ended'}
                    </span>
                  )}
                </td>
                <td style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>{new Date(m.timestamp).toLocaleString()}</td>
                <td>
                  <button className="table-action-btn" onClick={() => handleDelete(m.id)}><Trash2 size={13} style={{ color: '#fca5a5' }} /></button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: 'var(--clr-white-60)' }}>No messages in database.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Flower Library ───────────────────────────────────────────────────────────
function FlowerLibrary() {
  const [flowers, setFlowers] = useState(FLOWER_TYPES);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌸');
  const [rarity, setRarity] = useState('Common');

  const handleAdd = () => {
    if (!name) return;
    setFlowers(p => [...p, { id: name.toLowerCase().replace(/\s+/g, '_'), name, emoji, rarity, category: 'Classic', colors: ['#ff6b9d'], petalCount: 8 }]);
    setName(''); setShowForm(false);
  };

  return (
    <div>
      <div className="admin-header">
        <div><div className="admin-title">Flower Library</div></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add Type</button>
      </div>
      {showForm && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Emoji</label><input className="form-input" value={emoji} onChange={e => setEmoji(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Rarity</label><select className="form-select" value={rarity} onChange={e => setRarity(e.target.value)}><option>Common</option><option>Rare</option><option>Epic</option><option>Legendary</option></select></div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{ marginTop: 14 }}>Save</button>
        </div>
      )}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Emoji</th><th>Name</th><th>Rarity</th><th>Category</th><th>Actions</th></tr></thead>
          <tbody>
            {flowers.map((f, i) => (
              <tr key={i}>
                <td style={{ fontSize: '1.4rem' }}>{f.emoji}</td>
                <td style={{ fontWeight: 700 }}>{f.name}</td>
                <td><span className={`badge badge-${f.rarity?.toLowerCase()}`}>{f.rarity}</span></td>
                <td>{f.category}</td>
                <td><button className="table-action-btn" onClick={() => setFlowers(p => p.filter(x => x.id !== f.id))}><Trash2 size={13} style={{ color: '#fca5a5' }} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Products Manager ─────────────────────────────────────────────────────────
function ProductsManager() {
  const [products, setProducts] = useState(PRODUCTS_LIBRARY);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(9.99);
  const [coins, setCoins] = useState(150);
  const [cat, setCat] = useState('Seeds');
  const [emoji, setEmoji] = useState('🌱');

  const handleAdd = () => {
    if (!name) return;
    setProducts(p => [...p, { id: p.length + 1, name, category: cat, price, coins, image: emoji, stock: 50 }]);
    setName(''); setShowForm(false);
  };

  return (
    <div>
      <div className="admin-header">
        <div><div className="admin-title">Products Store</div></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add Product</button>
      </div>
      {showForm && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Product Name</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Emoji/Icon</label><input className="form-input" value={emoji} onChange={e => setEmoji(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Price ($)</label><input className="form-input" type="number" value={price} onChange={e => setPrice(+e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Bloom Coins</label><input className="form-input" type="number" value={coins} onChange={e => setCoins(+e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={cat} onChange={e => setCat(e.target.value)}><option>Seeds</option><option>Decorations</option><option>Plants</option><option>Gifts</option></select></div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{ marginTop: 14 }}>Save Product</button>
        </div>
      )}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Icon</th><th>Name</th><th>Category</th><th>Price</th><th>Coins</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ fontSize: '1.4rem' }}>{p.image}</td>
                <td style={{ fontWeight: 700 }}>{p.name}</td>
                <td><span className="chip">{p.category}</span></td>
                <td>${p.price?.toFixed(2)}</td>
                <td style={{ color: 'var(--clr-gold)', fontWeight: 800 }}>💎 {p.coins}</td>
                <td><button className="table-action-btn" onClick={() => setProducts(x => x.filter(i => i.id !== p.id))}><Trash2 size={13} style={{ color: '#fca5a5' }} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
function CategoryManager() {
  const [cats, setCats] = useState(CATEGORIES);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🌸');
  return (
    <div>
      <div className="admin-header"><div><div className="admin-title">Categories</div></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 16 }}>Create Category</h4>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Icon</label><input className="form-input" value={icon} onChange={e => setIcon(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => { if (name) setCats(p => [...p, { id: p.length + 1, name, count: 0, color: 'var(--clr-green)', icon }]); setName(''); }}>Create</button>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 16 }}>Active Categories</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cats.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                <span>{c.icon} {c.name}</span>
                <button className="table-action-btn" onClick={() => setCats(p => p.filter(x => x.id !== c.id))}><Trash2 size={13} style={{ color: '#fca5a5' }} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Events ───────────────────────────────────────────────────────────────────
function EventsManager() {
  const [events, setEvents] = useState([
    { id: 1, title: 'Monsoon Magic Week', theme: 'Water & Lily theme', startDate: '2026-07-10', status: 'Upcoming' },
  ]);
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('');
  return (
    <div>
      <div className="admin-header"><div><div className="admin-title">Seasonal Events</div></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 16 }}>Schedule Event</h4>
          <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Theme</label><input className="form-input" value={theme} onChange={e => setTheme(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => { if (title) setEvents(p => [...p, { id: p.length + 1, title, theme, startDate: new Date().toISOString().split('T')[0], status: 'Draft' }]); setTitle(''); }}>Schedule</button>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 16 }}>Events</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map(ev => (
              <div key={ev.id} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '0.85rem' }}>{ev.title}</strong>
                  <span className="badge badge-rare" style={{ fontSize: '0.62rem' }}>{ev.status}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)', marginTop: 4 }}>{ev.theme}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--clr-green)', marginTop: 4 }}>Starts: {ev.startDate}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Coupons ──────────────────────────────────────────────────────────────────
function CouponsManager() {
  const [coupons, setCoupons] = useState(REWARD_COUPONS);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('20% OFF');
  const [desc, setDesc] = useState('');
  return (
    <div>
      <div className="admin-header"><div><div className="admin-title">Coupon Rewards</div></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 16 }}>Create Coupon</h4>
          <div className="form-group"><label className="form-label">Code</label><input className="form-input" value={code} onChange={e => setCode(e.target.value)} placeholder="BLOOMGOLD" /></div>
          <div className="form-group"><label className="form-label">Discount</label><input className="form-input" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={desc} onChange={e => setDesc(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => { if (code) setCoupons(p => [...p, { code: code.toUpperCase(), discount, description: desc, active: true }]); setCode(''); }}>Save Coupon</button>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 16 }}>Active Coupons</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {coupons.map((c, i) => (
              <div key={i} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--clr-green)', fontSize: '0.85rem' }}>{c.code}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)', marginTop: 2 }}>{c.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-legendary">{c.discount}</span>
                  <button className="table-action-btn" onClick={() => setCoupons(p => p.filter((_, j) => j !== i))}><Trash2 size={13} style={{ color: '#fca5a5' }} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Activity ────────────────────────────────────────────────────────────
function ActivityFeed({ activeUsers }) {
  return (
    <div>
      <div className="admin-header"><div><div className="admin-title">Live Activity Monitor</div></div></div>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontWeight: 800, marginBottom: 14, color: 'var(--clr-green)', fontSize: '0.9rem' }}>🟢 Online Users ({activeUsers.length})</h4>
        {activeUsers.length === 0 ? (
          <p style={{ color: 'var(--clr-white-60)', fontSize: '0.82rem' }}>No active sessions right now.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {activeUsers.map((u, i) => (
              <div key={i} className="glass-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-sky))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', overflow: 'hidden' }}>
                  {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.avatarEmoji || '🌸'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--clr-green)' }}>Last seen {new Date(u.lastSeen).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Moderation + Reset ────────────────────────────────────────────────────────
function Moderation({ onRefresh }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = async () => {
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      if (res.ok) { setResetDone(true); setConfirmReset(false); onRefresh(); }
    } catch {}
  };

  return (
    <div>
      <div className="admin-header"><div><div className="admin-title">Moderation & Data Reset</div></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <ShieldCheck size={32} style={{ color: 'var(--clr-green)', marginBottom: 12 }} />
          <h4 style={{ fontWeight: 800, marginBottom: 8 }}>Content Status</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-white-60)' }}>No inappropriate content flagged. Platform is clean.</p>
        </div>

        <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(252,165,165,0.2)' }}>
          <RotateCcw size={32} style={{ color: '#fca5a5', marginBottom: 12 }} />
          <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#fca5a5' }}>Reset All Data</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--clr-white-60)', marginBottom: 16 }}>
            Delete all non-admin users, messages, follows, and blocks. This action cannot be undone.
          </p>
          {resetDone && <p style={{ color: 'var(--clr-green)', fontSize: '0.82rem', marginBottom: 12 }}>✅ All data reset successfully.</p>}
          <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={() => setConfirmReset(true)}>
            <RotateCcw size={15} /> Reset All Data
          </button>
        </div>
      </div>

      {confirmReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="glass-card" style={{ padding: 32, maxWidth: 420, width: '90%', textAlign: 'center' }}>
            <AlertTriangle size={44} style={{ color: '#fca5a5', margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ fontWeight: 900, marginBottom: 8 }}>⚠️ DANGER ZONE</h3>
            <p style={{ color: 'var(--clr-white-60)', fontSize: '0.85rem', marginBottom: 24 }}>
              This will permanently delete all users (except admin), all messages, all follows, and all blocks. Are you absolutely sure?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleReset}>
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Creator Hub (Verification & Application Management) ──────────────────────
function CreatorHub({ onRefresh }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('pending'); // pending | approved | rejected | all
  const [rejectUid, setRejectUid] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/creator/requests');
      if (r.ok) setRequests(await r.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (uid) => {
    try {
      const res = await fetch(`/api/admin/creator/${uid}/approve`, { method: 'POST' });
      if (res.ok) {
        setRequests(prev => prev.map(r => r.uid === uid ? { ...r, status: 'approved', reviewedAt: new Date().toISOString() } : r));
        onRefresh();
      }
    } catch {}
  };

  const handleRejectSubmit = async () => {
    if (!rejectUid) return;
    try {
      const res = await fetch(`/api/admin/creator/${rejectUid}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        setRequests(prev => prev.map(r => r.uid === rejectUid ? { ...r, status: 'rejected', reviewedAt: new Date().toISOString() } : r));
        setRejectUid(null);
        setRejectReason('');
        onRefresh();
      }
    } catch {}
  };

  const handleRevoke = async (uid) => {
    if (!window.confirm('Are you sure you want to revoke creator status for this user?')) return;
    try {
      const res = await fetch(`/api/admin/creator/${uid}/revoke`, { method: 'POST' });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.uid !== uid));
        onRefresh();
      }
    } catch {}
  };

  const filtered = requests.filter(r => {
    if (tab === 'pending') return r.status === 'pending';
    if (tab === 'approved') return r.status === 'approved';
    if (tab === 'rejected') return r.status === 'rejected';
    return true;
  });

  return (
    <div>
      <div className="admin-header">
        <div>
          <div className="admin-title">Creator Verification Hub</div>
          <div className="admin-subtitle">Review applications, verify digital gardeners, and manage creator status.</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadRequests}><RefreshCw size={14} /> Reload</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending', 'approved', 'rejected', 'all'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              background: tab === t ? 'var(--clr-green)' : 'rgba(255,255,255,0.04)',
              color: tab === t ? '#000' : 'var(--clr-white-60)'
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)} ({requests.filter(r => t === 'all' ? true : r.status === t).length})
          </button>
        ))}
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Gardener</th>
              <th>Reason / Statement</th>
              <th>Portfolio / Social</th>
              <th>Requested At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.uid}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', overflow: 'hidden' }}>
                      {r.avatar ? <img src={r.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : r.avatarEmoji || '🌸'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{r.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--clr-white-60)' }}>{r.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.78rem', maxStrWidth: 300, whiteSpace: 'normal', lineHeight: 1.4 }}>{r.reason}</td>
                <td style={{ fontSize: '0.75rem' }}>
                  {r.portfolio ? (
                    <a href={r.portfolio} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-sky)' }}>{r.portfolio}</a>
                  ) : <span style={{ color: 'var(--clr-white-40)' }}>—</span>}
                </td>
                <td style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>{new Date(r.requestedAt).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-${r.status === 'approved' ? 'rare' : r.status === 'pending' ? 'common' : 'legendary'}`} style={{ fontSize: '0.62rem' }}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {r.status === 'pending' && (
                      <>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem', color: 'var(--clr-green)', borderColor: 'rgba(134,239,172,0.3)' }} onClick={() => handleApprove(r.uid)}>Approve</button>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => setRejectUid(r.uid)}>Reject</button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem', color: '#fca5a5', borderColor: 'rgba(252,165,165,0.2)' }} onClick={() => handleRevoke(r.uid)}>Revoke Creator</button>
                    )}
                    {r.status === 'rejected' && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--clr-white-40)' }}>Rejected</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--clr-white-60)' }}>No requests in this section.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Reason Modal */}
      {rejectUid && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="glass-card" style={{ padding: 28, maxWidth: 360, width: '90%' }}>
            <h4 style={{ fontWeight: 800, marginBottom: 12 }}>Reject Verification</h4>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Rejection Reason</label>
              <textarea className="form-input" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide feedback to the gardener..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => { setRejectUid(null); setRejectReason(''); }}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleRejectSubmit}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Live Streams Manager (Audit) ─────────────────────────────────────────────
function LiveStreamsManager() {
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState('active'); // active | history

  const loadStreams = async () => {
    setLoading(true);
    try {
      const [actRes, histRes] = await Promise.all([
        fetch('/api/live/active'),
        fetch('/api/admin/live/history')
      ]);
      if (actRes.ok) setActive(await actRes.json());
      if (histRes.ok) setHistory(await histRes.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    loadStreams();
    const interval = setInterval(loadStreams, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="admin-header">
        <div>
          <div className="admin-title">Live Streams & Broadcasts</div>
          <div className="admin-subtitle">Audit active live streams, viewer metrics, comment logs, and past broadcasts.</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadStreams}><RefreshCw size={14} /> Reload</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setSubTab('active')}
          style={{
            padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
            background: subTab === 'active' ? 'var(--clr-green)' : 'rgba(255,255,255,0.04)',
            color: subTab === 'active' ? '#000' : 'var(--clr-white-60)'
          }}
        >
          🔴 Active Streams ({active.length})
        </button>
        <button onClick={() => setSubTab('history')}
          style={{
            padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
            background: subTab === 'history' ? 'var(--clr-green)' : 'rgba(255,255,255,0.04)',
            color: subTab === 'history' ? '#000' : 'var(--clr-white-60)'
          }}
        >
          📁 Broadcast Log ({history.length})
        </button>
      </div>

      {subTab === 'active' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {active.length === 0 && (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center', gridColumn: '1/-1' }}>
              <p style={{ color: 'var(--clr-white-60)', fontSize: '0.85rem' }}>No active live streams currently.</p>
            </div>
          )}
          {active.map(s => (
            <div key={s.streamerUid} className="glass-card" style={{ padding: 20, borderLeft: '3px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', overflow: 'hidden' }}>
                  {s.streamerAvatar ? <img src={s.streamerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.streamerEmoji || '🌸'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{s.streamerName}</div>
                  <div style={{ fontSize: '0.65rem', color: '#ef4444' }}>🔴 LIVE NOW</div>
                </div>
              </div>
              <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 8 }}>{s.title}</h4>
              <div style={{ display: 'flex', gap: 14, fontSize: '0.72rem', color: 'var(--clr-white-60)', borderTop: '1px solid var(--glass-border)', paddingTop: 10 }}>
                <span>👁️ {s.viewers} watching</span>
                <span>🕒 {new Date(s.startedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Streamer</th>
                <th>Title</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Peak Viewers</th>
                <th>Comments</th>
                <th>Gifts</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', overflow: 'hidden' }}>
                        {h.streamer_avatar ? <img src={h.streamer_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🌸'}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{h.streamer_name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{h.title}</td>
                  <td style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>{new Date(h.started_at).toLocaleString()}</td>
                  <td style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>{h.ended_at ? new Date(h.ended_at).toLocaleString() : <span style={{ color: '#ef4444' }}>Live</span>}</td>
                  <td style={{ fontWeight: 700 }}>{h.peak_viewers}</td>
                  <td>{h.total_comments}</td>
                  <td>{h.total_gifts}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--clr-white-60)' }}>No past broadcast logs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Layout ────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [realUsers, setRealUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [onlineUids, setOnlineUids] = useState(new Set());
  const [msgCount, setMsgCount] = useState(0);

  const refreshData = useCallback(async () => {
    try {
      const [usersRes, activeRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/admin/users/active'),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        if (Array.isArray(data)) setRealUsers(data);
        else console.error('[AdminPanel] /api/users returned non-array:', data);
      }
      if (activeRes.ok) {
        const aData = await activeRes.json();
        if (Array.isArray(aData)) setActiveUsers(aData);
      }
    } catch (err) { console.error('[AdminPanel] refreshData error:', err); }
  }, []);

  // Initial load — also re-fires when isAdmin becomes true (e.g. after auth resolves)
  useEffect(() => { if (isAdmin) refreshData(); }, [isAdmin, refreshData]);

  // ── Socket.IO real-time admin events ─────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    // New user registered — add instantly
    const onUserRegistered = (user) => {
      setRealUsers(prev => {
        if (prev.some(u => u.uid === user.uid)) return prev;
        return [...prev, user];
      });
    };

    // Profile or block state updated
    const onUserUpdated = (updatedUser) => {
      setRealUsers(prev => prev.map(u => u.uid === updatedUser.uid ? { ...u, ...updatedUser } : u));
    };

    // User deleted
    const onUserDeleted = ({ uid }) => {
      setRealUsers(prev => prev.filter(u => u.uid !== uid));
      setActiveUsers(prev => prev.filter(u => u.uid !== uid));
    };

    // Online/offline presence
    const onUserOnline = ({ uid }) => {
      setOnlineUids(prev => new Set([...prev, uid]));
      setActiveUsers(prev => {
        if (prev.some(u => u.uid === uid)) return prev;
        // Fetch to get name etc, or add minimal entry
        const user = realUsers.find(u => u.uid === uid);
        if (user) return [...prev, { uid, name: user.name, avatarEmoji: user.avatarEmoji, lastSeen: new Date().toISOString(), isOnline: true }];
        return prev;
      });
    };

    const onUserOffline = ({ uid }) => {
      setOnlineUids(prev => { const n = new Set(prev); n.delete(uid); return n; });
      setActiveUsers(prev => prev.filter(u => u.uid !== uid));
    };

    // New message received
    const onMessageNew = () => setMsgCount(c => c + 1);

    // Platform reset
    const onPlatformReset = () => refreshData();

    socket.on('user:registered', onUserRegistered);
    socket.on('admin:userRegistered', onUserRegistered);
    socket.on('user:updated', onUserUpdated);
    socket.on('admin:userUpdated', onUserUpdated);
    socket.on('user:profileUpdated', onUserUpdated);
    socket.on('user:deleted', onUserDeleted);
    socket.on('admin:userDeleted', onUserDeleted);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);
    socket.on('admin:messageNew', onMessageNew);
    socket.on('platform:reset', onPlatformReset);

    return () => {
      socket.off('user:registered', onUserRegistered);
      socket.off('admin:userRegistered', onUserRegistered);
      socket.off('user:updated', onUserUpdated);
      socket.off('admin:userUpdated', onUserUpdated);
      socket.off('user:profileUpdated', onUserUpdated);
      socket.off('user:deleted', onUserDeleted);
      socket.off('admin:userDeleted', onUserDeleted);
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
      socket.off('admin:messageNew', onMessageNew);
      socket.off('platform:reset', onPlatformReset);
    };
  }, []);

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 40 }}>
        <Shield size={60} style={{ color: 'var(--clr-lavender)', opacity: 0.7 }} />
        <h2 style={{ fontWeight: 900, fontSize: '1.8rem' }}>Admin Access Required</h2>
        <p style={{ color: 'var(--clr-white-60)', textAlign: 'center', maxWidth: 360 }}>Login with admin credentials to access the dashboard.</p>
        <button className="btn btn-primary" onClick={() => navigate('/admin/login')}>Admin Login</button>
      </div>
    );
  }

  let panelElement;
  if (activeSection === 'dashboard') {
    panelElement = <Dashboard realUsers={realUsers} activeUsers={activeUsers} onNav={setActiveSection} />;
  } else if (activeSection === 'flowers') {
    panelElement = <FlowerLibrary />;
  } else if (activeSection === 'categories') {
    panelElement = <CategoryManager />;
  } else if (activeSection === 'products') {
    panelElement = <ProductsManager />;
  } else if (activeSection === 'events') {
    panelElement = <EventsManager />;
  } else if (activeSection === 'users') {
    panelElement = <UserManagement realUsers={realUsers} onRefresh={refreshData} />;
  } else if (activeSection === 'register') {
    panelElement = <RegisterUser onRefresh={refreshData} />;
  } else if (activeSection === 'creator-hub') {
    panelElement = <CreatorHub onRefresh={refreshData} />;
  } else if (activeSection === 'live-streams') {
    panelElement = <LiveStreamsManager />;
  } else if (activeSection === 'messages') {
    panelElement = <UserMessagesManager />;
  } else if (activeSection === 'coupons') {
    panelElement = <CouponsManager />;
  } else if (activeSection === 'activity') {
    panelElement = <ActivityFeed activeUsers={activeUsers} />;
  } else if (activeSection === 'moderation') {
    panelElement = <Moderation onRefresh={refreshData} />;
  } else {
    panelElement = <Dashboard realUsers={realUsers} activeUsers={activeUsers} onNav={setActiveSection} />;
  }

  const Sidebar = () => (
    <div className="admin-sidebar">
      {/* Logo */}
      <div className="admin-sidebar-logo" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '1.5rem' }}>🌸</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>HandBloom AI</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--clr-green)' }}>Admin Panel</div>
        </div>
      </div>

      {/* Admin Info */}
      <div style={{ padding: '10px 12px', marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--clr-lavender),var(--clr-gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
          {currentUser?.avatarEmoji || '👑'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{currentUser?.name || 'Admin'}</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--clr-lavender)' }}>Administrator</div>
        </div>
      </div>

      {/* Live Stats Pill */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.68rem', padding: '4px 10px', borderRadius: 99, background: 'rgba(134,239,172,0.1)', color: 'var(--clr-green)', border: '1px solid rgba(134,239,172,0.2)' }}>
          🟢 {activeUsers.length} Online
        </span>
        <span style={{ fontSize: '0.68rem', padding: '4px 10px', borderRadius: 99, background: 'rgba(196,181,253,0.1)', color: 'var(--clr-lavender)', border: '1px solid rgba(196,181,253,0.2)' }}>
          👤 {realUsers.length} Users
        </span>
      </div>

      {/* Nav */}
      {NAV_SECTIONS.map(section => (
        <div key={section.title} className="admin-nav-section">
          <div className="admin-nav-section-title">{section.title}</div>
          {section.items.map(item => (
            <div
              key={item.id}
              className={`admin-nav-item${activeSection === item.id ? ' active' : ''}`}
              onClick={() => { setActiveSection(item.id); setMobileNavOpen(false); }}
            >
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginTop: 28 }}>
        <div className="admin-nav-item" style={{ color: '#fca5a5' }} onClick={() => { logout(); navigate('/'); }}>
          <LogOut size={16} /> Logout
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-layout" style={{ minHeight: '100vh' }}>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        style={{
          display: 'none', position: 'fixed', top: 12, left: 12, zIndex: 9999,
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          borderRadius: 10, padding: 10, color: 'white', cursor: 'pointer',
        }}
        className="admin-mobile-toggle"
      >
        ☰
      </button>

      {/* Mobile Nav Overlay */}
      {mobileNavOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileNavOpen(false)}>
          <div style={{ width: 260, height: '100%', background: '#0d1130', padding: '60px 0 20px', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="admin-content">
        {panelElement}
      </div>
    </div>
  );
}
