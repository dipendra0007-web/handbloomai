import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Flower2, Sparkles, User, Mail, Lock, AtSign, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const { login, signup, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (key, val) => { setForm(p => ({ ...p, [key]: val })); setFormError(''); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (mode === 'signup') {
        if (!form.name.trim()) return setFormError('Full name is required.');
        if (!form.username.trim()) return setFormError('Username is required.');
        if (form.password.length < 6) return setFormError('Password must be at least 6 characters.');
        if (form.password !== form.confirm) return setFormError('Passwords do not match.');
        await signup({ name: form.name, username: form.username, email: form.email, password: form.password });
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate('/');
    } catch {}
  };

  const displayError = formError || error;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(134,239,172,0.12), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(196,181,253,0.08), transparent), #06081a',
      padding: '24px',
      paddingTop: '80px',
    }}>
      {/* Floating orbs */}
      <div style={{ position: 'fixed', top: '-100px', left: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(134,239,172,0.08), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-80px', right: '-80px', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(196,181,253,0.06), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, rgba(134,239,172,0.2), rgba(196,181,253,0.2))',
            border: '1px solid rgba(134,239,172,0.3)',
            borderRadius: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(134,239,172,0.15)',
          }}>🌸</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>HandBloom <span className="text-gradient-green">AI</span></h1>
          <p style={{ color: 'var(--clr-white-60)', marginTop: 8, fontSize: '0.9rem' }}>
            {mode === 'login' ? 'Welcome back, gardener 🌿' : 'Join the digital garden 🌸'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 28,
          padding: '36px 32px',
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: 4,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 99, marginBottom: 28,
          }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setFormError(''); setError(''); }}
                style={{
                  flex: 1, padding: '9px 16px', borderRadius: 99, border: 'none',
                  fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '0.9rem',
                  cursor: 'pointer', transition: 'all 0.25s',
                  background: mode === m ? 'linear-gradient(135deg, var(--clr-green), var(--clr-sky))' : 'transparent',
                  color: mode === m ? '#0d1130' : 'var(--clr-white-60)',
                  boxShadow: mode === m ? '0 2px 12px rgba(134,239,172,0.3)' : 'none',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-white-60)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 42 }}
                      placeholder="Your full name"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      required
                    />
                  </div>
                </div>
                {/* Username */}
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div style={{ position: 'relative' }}>
                    <AtSign size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-white-60)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 42 }}
                      placeholder="yourhandle"
                      value={form.username}
                      onChange={e => set('username', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-white-60)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-white-60)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
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

            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-white-60)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 42 }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={e => set('confirm', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {displayError && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(252,165,165,0.1)',
                border: '1px solid rgba(252,165,165,0.3)',
                borderRadius: 12,
                color: '#fca5a5',
                fontSize: '0.85rem',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                ⚠️ {displayError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', gap: 8, marginTop: 4 }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Demo hint */}
          {mode === 'login' && (
            <div style={{
              marginTop: 20,
              padding: '12px 16px',
              background: 'rgba(134,239,172,0.05)',
              border: '1px solid rgba(134,239,172,0.15)',
              borderRadius: 12,
              fontSize: '0.78rem',
              color: 'var(--clr-white-60)',
            }}>
              <span style={{ color: 'var(--clr-green)' }}>✨ Admin?</span> Use the{' '}
              <Link to="/admin/login" style={{ color: 'var(--clr-sky)', textDecoration: 'none' }}>
                Admin Login page
              </Link>{' '}
              to access the dashboard.
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: 'var(--clr-white-60)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setFormError(''); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--clr-green)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
          >
            {mode === 'login' ? 'Sign Up Free' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
