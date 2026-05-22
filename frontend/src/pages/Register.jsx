import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ALL_SPORTS = ['football','padel','running','basketball','tennis','cycling'];
const SPORT_LABELS = {
  football:'⚽ Futebol', padel:'🏓 Padel', running:'🏃 Corrida',
  basketball:'🏀 Basquetebol', tennis:'🎾 Ténis', cycling:'🚴 Ciclismo',
};

export default function Register() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username:'', fullName:'', email:'', password:'', password2:'', city:'',
  });
  const [sports, setSports]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleSport = (s) => setSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.fullName || !form.email || !form.password) {
      setError('Preenche todos os campos obrigatórios.'); return;
    }
    if (form.password !== form.password2) {
      setError('As palavras-passe não coincidem.'); return;
    }
    if (form.password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.'); return;
    }
    setLoading(true);
    try {
      const { data } = await authService.register({ ...form, sports });
      login(data.user, data.token);
      toast.success(`Conta criada! Bem-vindo, ${data.user.fullName}!`);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div className="logo" style={{ fontSize: 24, justifyContent: 'center', display: 'flex', cursor: 'pointer' }}
            onClick={() => navigate('/')}>
            Sports<span>Hub</span>
          </div>
          <div className="logo-tag" style={{ textAlign: 'center', marginTop: 4, cursor: 'pointer', color: 'var(--t3)' }}
            onClick={() => navigate('/')}>Social Platform</div>
        </div>
        <h3 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Criar conta</h3>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 22 }}>Junta-te à comunidade desportiva</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="fg"><label>Nome de utilizador *</label>
              <input className="fi" placeholder="joao.silva" value={form.username} onChange={set('username')} /></div>
            <div className="fg"><label>Nome completo *</label>
              <input className="fi" placeholder="João Silva" value={form.fullName} onChange={set('fullName')} /></div>
          </div>
          <div className="fg"><label>Email *</label>
            <input type="email" className="fi" placeholder="joao@email.com" value={form.email} onChange={set('email')} /></div>
          <div className="form-row">
            <div className="fg"><label>Palavra-passe *</label>
              <input type="password" className="fi" placeholder="mín. 6 caracteres" value={form.password} onChange={set('password')} /></div>
            <div className="fg"><label>Confirmar *</label>
              <input type="password" className="fi" placeholder="••••••••" value={form.password2} onChange={set('password2')} /></div>
          </div>
          <div className="fg"><label>Cidade</label>
            <input className="fi" placeholder="Lisboa" value={form.city} onChange={set('city')} /></div>
          <div className="fg">
            <label>Desportos de interesse</label>
            <div className="sports-pick">
              {ALL_SPORTS.map(s => (
                <div key={s} className={`sport-opt ${sports.includes(s) ? 'on' : ''}`} onClick={() => toggleSport(s)}>
                  {SPORT_LABELS[s]}
                </div>
              ))}
            </div>
          </div>
          {error && <div style={{ fontSize: 12.5, color: '#f87171', marginBottom: 12 }}>{error}</div>}
          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', padding: 12, fontSize: 15 }} disabled={loading}>
            {loading ? 'A criar...' : '🚀 Criar Conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--t2)', marginTop: 16 }}>
          Já tens conta? <Link to="/login" style={{ color: 'var(--g)', fontWeight: 500 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
