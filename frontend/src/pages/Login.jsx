// ════════════════ Login.jsx ════════════════
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Preenche email e palavra-passe.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authService.login({ email, password });
      login(data.user, data.token);
      toast.success(`Bem-vindo de volta, ${data.user.fullName || data.user.username}!`);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="logo" style={{ fontSize: 26, justifyContent: 'center', display: 'flex', cursor: 'pointer' }}
            onClick={() => navigate('/')}>
            Sports<span>Hub</span>
          </div>
          <div className="logo-tag" style={{ textAlign: 'center', marginTop: 4, cursor: 'pointer', color: 'var(--t3)' }}
            onClick={() => navigate('/')}>Social Platform</div>
        </div>
        <h3 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Bem-vindo de volta</h3>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 22 }}>Entra na tua conta para continuar</p>

        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label>Email</label>
            <input type="email" className="fi" placeholder="o.teu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="fg">
            <label>Palavra-passe</label>
            <input type="password" className="fi" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div style={{ fontSize: 12.5, color: '#f87171', marginBottom: 12 }}>{error}</div>}
          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', padding: 12, fontSize: 15 }} disabled={loading}>
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-or">ou</div>
        <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--t2)' }}>
          Não tens conta? <Link to="/register" style={{ color: 'var(--g)', fontWeight: 500 }}>Criar conta grátis</Link>
        </p>
        <div className="card-plain" style={{ marginTop: 18, fontSize: 12, color: 'var(--t3)' }}>
          <strong style={{ color: 'var(--t2)' }}>Demo:</strong> admin@sportshub.pt · 123456
        </div>
      </div>
    </div>
  );
}
