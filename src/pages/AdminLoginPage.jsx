import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Shield, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setError('');
    try {
      const user = await login({ email, password });
      if (user.role !== 'admin') {
        setLocalError('Access denied. Admin credentials required.');
        return;
      }
      navigate('/admin');
    } catch {}
  };

  const displayError = localError || error;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(196,181,253,0.12), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(252,211,77,0.06), transparent), #06081a',
      padding: 24,
    }}>
      {/* Background orb */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(196,181,253,0.06), transparent)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 80, height: 80,
            background: 'linear-gradient(135deg, rgba(196,181,253,0.2), rgba(252,211,77,0.15))',
            border: '1px solid rgba(196,181,253,0.3)',
            borderRadius: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 40px rgba(196,181,253,0.15)',
          }}>
            <Shield size={36} style={{ color: 'var(--clr-lavender)' }} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>
            <span className="text-gradient-cosmic">Admin Panel</span>
          </h1>
          <p style={{ color: 'var(--clr-white-60)', marginTop: 8, fontSize: '0.9rem' }}>
            HandBloom AI – Restricted Access
          </p>
        </div>

        {/* Security badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px',
          background: 'rgba(196,181,253,0.07)',
          border: '1px solid rgba(196,181,253,0.2)',
          borderRadius: 12,
          marginBottom: 24,
          fontSize: '0.82rem',
        }}>
          <Lock size={14} style={{ color: 'var(--clr-lavender)', flexShrink: 0 }} />
          <span style={{ color: 'var(--clr-white-60)' }}>
            Secured connection · Admin credentials required
          </span>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 28,
          padding: '36px 32px',
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-white-60)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  type="email"
                  placeholder="admin@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-white-60)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 42, paddingRight: 44 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--clr-white-60)', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {displayError && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(252,165,165,0.1)',
                border: '1px solid rgba(252,165,165,0.3)',
                borderRadius: 12,
                color: '#fca5a5',
                fontSize: '0.85rem',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <AlertCircle size={14} /> {displayError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                borderRadius: 99,
                fontFamily: 'var(--font-primary)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--clr-lavender), var(--clr-sky))',
                color: '#0d1130',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 20px rgba(196,181,253,0.4)',
                transition: 'all 0.3s',
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: 'var(--clr-white-60)' }}>
          Not an admin?{' '}
          <a href="/auth" style={{ color: 'var(--clr-green)', textDecoration: 'none', fontWeight: 700 }}>
            User Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
