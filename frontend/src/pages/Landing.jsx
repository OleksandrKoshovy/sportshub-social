import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { eventService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) { navigate('/feed', { replace: true }); return; }
    eventService.getAll({ sort: 'date', upcoming: 'true' })
      .then(({ data }) => setFeatured(data.events.slice(0, 3)))
      .catch(() => {});
  }, [user]);

  return (
    <div style={{ padding: 0 }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="logo" style={{ fontSize: 20 }}>Sports<span>Hub</span></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ padding: '8px 20px', fontSize: 14 }}
            onClick={() => navigate('/login')}>
            Entrar
          </button>
          <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 14 }}
            onClick={() => navigate('/register')}>
            Registar
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="land-hero">
        <div className="hero-inner">
          <div className="hero-pill">🏆 Rede Social Desportiva</div>
          <h1 className="hero-h1">Sports<span>Hub</span><br />Social</h1>
          <p className="hero-sub">
            Organiza e participa em eventos desportivos amadores com amigos.
            Futebol, padel, corrida e muito mais.
          </p>
          <div className="hero-btns">
            <button className="btn btn-primary" style={{ padding: '13px 32px', fontSize: 15 }}
              onClick={() => navigate('/register')}>
              Criar Conta Grátis
            </button>
            <button className="btn btn-ghost" style={{ padding: '13px 32px', fontSize: 15 }}
              onClick={() => navigate('/login')}>
              Entrar →
            </button>
          </div>
        </div>
      </div>

      {/* Funcionalidades */}
      <div className="land-sect">
        <h2 style={{ fontFamily: 'Syne', fontSize: 40, fontWeight: 800, textAlign: 'center' }}>Tudo o que precisas</h2>
        <p style={{ textAlign: 'center', color: 'var(--t2)', fontSize: 15, marginTop: 8 }}>
          Uma plataforma completa para a tua vida desportiva amadora
        </p>
        <div className="feat-grid">
          {[
            { ico:'fic-g', e:'📅', t:'Cria & Gere Eventos', d:'Organiza partidas, treinos e competições em segundos.' },
            { ico:'fic-b', e:'⭐', t:'Avalia & Sobe no Ranking', d:'Avalia jogadores após cada evento. Ranking automático.' },
            { ico:'fic-o', e:'📸', t:'Partilha Momentos', d:'Adiciona fotos e guarda memórias dos melhores jogos.' },
            { ico:'fic-g', e:'🔍', t:'Descobre Eventos', d:'Filtra por desporto, data e local. Inscreve-te com um clique.' },
            { ico:'fic-b', e:'👥', t:'Conhece Jogadores', d:'Vê perfis e avaliações de outros participantes.' },
            { ico:'fic-o', e:'🛡️', t:'Plataforma Segura', d:'Autenticação JWT e moderação por administradores.' },
          ].map((f, i) => (
            <div key={i} className="feat-card">
              <div className={`feat-ico ${f.ico}`}>{f.e}</div>
              <div className="feat-title">{f.t}</div>
              <p className="feat-desc">{f.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Eventos em destaque */}
      {featured.length > 0 && (
        <div className="land-sect" style={{ paddingTop: 0 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, marginBottom: 28, textAlign: 'center' }}>
            Eventos em Destaque
          </h2>
          <div className="events-grid">
            {featured.map(ev => <EventCard key={ev.id} event={ev} onUpdate={() => {}} />)}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}
              onClick={() => navigate('/feed')}>
              Ver todos os eventos →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
