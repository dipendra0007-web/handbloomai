import { useState, useEffect } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { Flower2, Home, Palette, Image, User, Settings, Menu, X, Sparkles, ChevronRight, LogOut, LogIn, Globe, MessageSquare, Users, Radio } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSocket } from '../hooks/useSocket';

const NAV_LINKS = [
  { to: '/',       label: 'Home',      icon: Home },
  { to: '/garden', label: 'Garden',    icon: Flower2 },
  { to: '/studio', label: 'Studio',    icon: Palette },
  { to: '/profile', label: 'Profile',  icon: User },
  { to: '/social',   label: 'SocialVerse', icon: Users },
  { to: '/omniverse', label: 'Omniverse', icon: Globe },
  { to: '/messages',  label: 'Messages',  icon: MessageSquare },
  { to: '/live',      label: 'Live Stream', icon: Radio },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasLive, setHasLive] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, isAdmin, logout } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Poll for active streams on mount & setup sockets for instant updates
  useEffect(() => {
    const checkLive = async () => {
      try {
        const res = await fetch('/api/live/active');
        if (res.ok) {
          const list = await res.json();
          setHasLive(list.length > 0);
        }
      } catch {}
    };
    checkLive();

    const socket = getSocket();
    if (socket) {
      const onStarted = () => setHasLive(true);
      const onStopped = async () => {
        // Re-check
        await checkLive();
      };
      socket.on('live:started', onStarted);
      socket.on('live:stopped', onStopped);
      return () => {
        socket.off('live:started', onStarted);
        socket.off('live:stopped', onStopped);
      };
    }
  }, [currentUser]);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const handleLogout = async () => {
    setMobileOpen(false);
    setDropdownOpen(false);
    await logout();
    navigate('/auth');
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        {/* Logo */}
        <NavLink to="/" className="navbar-logo" onClick={() => { setMobileOpen(false); setDropdownOpen(false); }}>
          <div className="navbar-logo-icon">🌸</div>
          <span className="navbar-logo-text">HandBloom AI</span>
        </NavLink>

        {/* Desktop Links */}
        <ul className="navbar-links">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <li key={to} style={{ position: 'relative' }}>
              <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''} end={to === '/'}>
                <Icon size={14} /> {label}
                {label === 'Live Stream' && hasLive && (
                  <span style={{
                    position: 'absolute', top: -3, right: -4, width: 8, height: 8,
                    background: '#ef4444', borderRadius: '50%',
                    border: '1.5px solid #06081a',
                    boxShadow: '0 0 8px #ef4444'
                  }}></span>
                )}
              </NavLink>
            </li>
          ))}
          {isAdmin && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                <Settings size={14} /> Admin
              </NavLink>
            </li>
          )}
        </ul>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          {isLoggedIn ? (
            <div style={{ position: 'relative', zIndex: 9999 }}>
              {/* User Avatar Button */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px 6px 6px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 99,
                  cursor: 'pointer',
                  color: 'white',
                  fontFamily: 'var(--font-primary)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                  background: 'linear-gradient(135deg, var(--clr-green), var(--clr-lavender))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                }}>
                  {currentUser?.avatar
                    ? <img src={currentUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : currentUser?.avatarEmoji || '🌸'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser?.name?.split(' ')[0] || 'User'}
                </span>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: 'rgba(13,17,48,0.98)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 20,
                  padding: '8px',
                  minWidth: 200,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                  zIndex: 9999,
                  animation: 'modalSlide 0.2s ease',
                }}>
                  {/* User info */}
                  <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--glass-border)', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{currentUser?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>{currentUser?.email}</div>
                    {isAdmin && <span className="badge badge-legendary" style={{ marginTop: 4, fontSize: '0.65rem' }}>👑 Admin</span>}
                  </div>

                  {[
                    { label: 'My Profile', to: '/profile', icon: '👤' },
                    { label: 'My Garden', to: '/garden', icon: '🌿' },
                    { label: 'Studio', to: '/studio', icon: '🎨' },
                    ...(isAdmin ? [{ label: 'Admin Panel', to: '/admin', icon: '⚙️' }] : []),
                  ].map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 12,
                        textDecoration: 'none', color: 'var(--clr-white-80)',
                        fontSize: '0.85rem', fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>{item.icon}</span> {item.label}
                    </Link>
                  ))}

                  <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: 6, paddingTop: 6 }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 12,
                        background: 'none', border: 'none', color: '#fca5a5',
                        fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s', fontFamily: 'var(--font-primary)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,165,165,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn btn-secondary btn-sm" onClick={() => { setMobileOpen(false); setDropdownOpen(false); }}>
              <LogIn size={15} /> Sign In
            </Link>
          )}

          <NavLink to="/studio" className="btn btn-primary btn-sm" onClick={() => { setMobileOpen(false); setDropdownOpen(false); }}>
            <Sparkles size={15} /> Create
          </NavLink>

          <button
            className="navbar-mobile-toggle btn-icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'white' }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Click outside to close dropdown */}
      {dropdownOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setDropdownOpen(false)} />}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 68, left: 0, right: 0, zIndex: 1999,
          background: 'rgba(6,8,26,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '12px',
          animation: 'fadeSlideUp 0.2s ease',
        }}>
          {isLoggedIn && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', marginBottom: 8,
              background: 'var(--glass-bg)', borderRadius: 14,
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,var(--clr-green),var(--clr-lavender))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {currentUser?.avatar ? <img src={currentUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : currentUser?.avatarEmoji || '🌸'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{currentUser?.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--clr-white-60)' }}>{currentUser?.email}</div>
              </div>
            </div>
          )}

          {/* Regular Navigation Links */}
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, textDecoration: 'none', color: 'var(--clr-white-80)', marginBottom: 2, fontWeight: 600, fontSize: '0.9rem', position: 'relative' }}>
              <Icon size={18} /> {label}
              {label === 'Live Stream' && hasLive && (
                <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '1.5px solid #06081a', display: 'inline-block', marginLeft: 6, boxShadow: '0 0 6px #ef4444' }}></span>
              )}
              <ChevronRight size={15} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </NavLink>
          ))}

          {/* Logged In Specific Options on Mobile */}
          {isLoggedIn && (
            <>
              <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: 8, paddingTop: 8 }}>
                <NavLink to="/profile" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, textDecoration: 'none', color: 'var(--clr-white-80)', marginBottom: 2, fontWeight: 600, fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>👤</span> My Profile <ChevronRight size={15} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                </NavLink>
                <NavLink to="/garden" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, textDecoration: 'none', color: 'var(--clr-white-80)', marginBottom: 2, fontWeight: 600, fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🌿</span> My Garden <ChevronRight size={15} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                </NavLink>
                <NavLink to="/studio" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, textDecoration: 'none', color: 'var(--clr-white-80)', marginBottom: 2, fontWeight: 600, fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🎨</span> Studio <ChevronRight size={15} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, textDecoration: 'none', color: 'var(--clr-white-80)', marginBottom: 2, fontWeight: 600, fontSize: '0.9rem' }}>
                    <Settings size={18} /> Admin Panel <ChevronRight size={15} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                  </NavLink>
                )}
              </div>
            </>
          )}

          <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: 8, paddingTop: 8 }}>
            {isLoggedIn ? (
              <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                <LogOut size={18} /> Sign Out
              </button>
            ) : (
              <NavLink to="/auth" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, textDecoration: 'none', color: 'var(--clr-green)', fontWeight: 700, fontSize: '0.9rem' }}>
                <LogIn size={18} /> Sign In / Sign Up
              </NavLink>
            )}
          </div>
        </div>
      )}
    </>
  );
}
