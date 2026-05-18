import React, { useState, useEffect, useCallback } from 'react';
import EventCard from '../components/EventCard';
import { eventService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SPORTS = [
  { value: '',           label: 'Todos' },
  { value: 'football',   label: '⚽ Futebol' },
  { value: 'padel',      label: '🏓 Padel' },
  { value: 'running',    label: '🏃 Corrida' },
  { value: 'basketball', label: '🏀 Basquetebol' },
  { value: 'tennis',     label: '🎾 Ténis' },
  { value: 'cycling',    label: '🚴 Ciclismo' },
];

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [query, setQuery]       = useState('');
  const [sport, setSport]       = useState('');
  const [sort, setSort]         = useState('date');
  const [onlyFree, setOnlyFree] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { sort };
      if (sport)    params.sport     = sport;
      if (onlyFree) params.available = 'true';

      const { data } = await eventService.getAll(params);

      // Filtro de pesquisa de texto (lado do cliente)
      const q = query.toLowerCase();
      const filtered = q
        ? data.events.filter(e =>
            e.title.toLowerCase().includes(q) ||
            e.location.toLowerCase().includes(q)
          )
        : data.events;

      setEvents(filtered);
    } catch (err) {
      setError('Não foi possível carregar os eventos. Verifica a ligação à API.');
    } finally {
      setLoading(false);
    }
  }, [sport, sort, onlyFree, query]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="page">
      {/* Topbar */}
      <div className="topbar">
        <div className="page-head">
          <h2>Feed de Eventos</h2>
          <p>{loading ? 'A carregar...' : `${events.length} evento${events.length !== 1 ? 's' : ''} disponíve${events.length !== 1 ? 'is' : 'l'}`}</p>
        </div>
        <div className="topbar-actions">
          {user && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/create')}>
              + Criar Evento
            </button>
          )}
        </div>
      </div>

      {/* Barra de pesquisa + ordenação */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div className="sw" style={{ flex: 1 }}>
          <span className="sico">🔍</span>
          <input
            type="text"
            className="fi sinp"
            placeholder="Pesquisar eventos, desportos, locais..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="fi" style={{ width: 175 }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="date">Data mais próxima</option>
          <option value="popular">Mais participantes</option>
        </select>
      </div>

      {/* Chips de filtro por desporto */}
      <div className="chips">
        {SPORTS.map((s) => (
          <div
            key={s.value}
            className={`chip ${sport === s.value ? 'on' : ''}`}
            onClick={() => setSport(s.value)}
          >
            {s.label}
          </div>
        ))}
        <div
          className={`chip ${onlyFree ? 'on' : ''}`}
          onClick={() => setOnlyFree(f => !f)}
        >
          Com vagas
        </div>
      </div>

      {/* Grelha de eventos */}
      {loading ? (
        <div className="empty"><span>⏳</span><b>A carregar eventos...</b></div>
      ) : error ? (
        <div className="empty"><span>⚠️</span><b>{error}</b></div>
      ) : events.length === 0 ? (
        <div className="empty">
          <span>🔍</span>
          <b>Nenhum evento encontrado</b>
          <div>Tenta outros filtros ou cria o teu próprio evento</div>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} onUpdate={fetchEvents} />
          ))}
        </div>
      )}
    </div>
  );
}
