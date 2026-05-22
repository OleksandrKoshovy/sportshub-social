import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EventCard from '../components/EventCard';

const TABS = [
  { key: 'upcoming', label: '📅 A Decorrer / Próximos' },
  { key: 'created',  label: '🏆 Criados por mim' },
  { key: 'past',     label: '🕐 Histórico' },
];

export default function MyEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]       = useState('upcoming');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/events')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    api.get('/users/me/events')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };

  const list = data?.[tab] || [];

  return (
    <div className="page">
      <div className="topbar">
        <div className="page-head">
          <h2>Os Meus Eventos</h2>
          <p>Eventos que criaste e em que participas</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/create')}>
          + Criar Evento
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--b)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 16px', fontSize: 13.5, fontWeight: 500,
              color: tab === t.key ? 'var(--g)' : 'var(--t2)',
              borderBottom: tab === t.key ? '2px solid var(--g)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
            {data && (
              <span style={{
                marginLeft: 6, background: 'var(--s)', borderRadius: 10,
                padding: '1px 7px', fontSize: 11, color: 'var(--t2)',
              }}>
                {data[t.key]?.length || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty"><span>⏳</span><b>A carregar...</b></div>
      ) : list.length === 0 ? (
        <div className="empty">
          <span>{tab === 'upcoming' ? '📅' : tab === 'created' ? '🏆' : '🕐'}</span>
          <b>
            {tab === 'upcoming' && 'Sem eventos próximos'}
            {tab === 'created'  && 'Ainda não criaste nenhum evento'}
            {tab === 'past'     && 'Sem eventos no histórico'}
          </b>
          {tab !== 'past' && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/create')}>
              Criar primeiro evento
            </button>
          )}
        </div>
      ) : (
        <div className="events-grid">
          {list.map(ev => (
            <EventCard key={ev.id} event={ev} onUpdate={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
