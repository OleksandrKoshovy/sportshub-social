import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { eventService } from '../services/api';

const SPORT_CFG = {
  football:   { label: 'Futebol',      icon: '⚽', cls: 'b-football' },
  padel:      { label: 'Padel',        icon: '🏓', cls: 'b-padel' },
  running:    { label: 'Corrida',      icon: '🏃', cls: 'b-running' },
  basketball: { label: 'Basquetebol', icon: '🏀', cls: 'b-basketball' },
  tennis:     { label: 'Ténis',        icon: '🎾', cls: 'b-tennis' },
  cycling:    { label: 'Ciclismo',     icon: '🚴', cls: 'b-cycling' },
};

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00').toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function EventCard({ event, onUpdate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const sport = SPORT_CFG[event.sport] || SPORT_CFG.football;
  const pct   = Math.min(100, Math.round((event.currentParticipants / event.maxParticipants) * 100));
  const full  = event.currentParticipants >= event.maxParticipants;
  const fillCls = pct >= 100 ? 'pf-r' : pct >= 75 ? 'pf-o' : 'pf-g';

  const handleJoin = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Faz login para te inscreveres!'); navigate('/login'); return; }

    try {
      if (event.isJoined) {
        await eventService.leave(event.id);
        toast.success('Inscrição cancelada.');
      } else {
        await eventService.join(event.id);
        toast.success('Inscrito com sucesso!');
      }
      onUpdate?.(); // refresh da lista no componente pai
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao processar inscrição.');
    }
  };

  return (
    <div className="ec" onClick={() => navigate(`/events/${event.id}`)}>
      <div className="ec-head">
        <span className={`badge ${sport.cls}`}>{sport.icon} {sport.label}</span>
        <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{formatDate(event.date)}</span>
      </div>
      <div className="ec-body">
        <div className="ec-title">{event.title}</div>
        <div className="ec-meta">
          <div className="ec-row"><span>⏰</span>{event.time}</div>
          <div className="ec-row"><span>📍</span>{event.location}</div>
          <div className="ec-row"><span>👤</span>{event.organizerName}</div>
        </div>
      </div>
      <div className="ec-foot">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>
            {event.currentParticipants}/{event.maxParticipants} participantes{full ? ' · Cheio' : ''}
          </div>
          <div className="pt">
            <div className={`pf ${fillCls}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          className={`btn btn-xs ${event.isJoined ? 'btn-ghost' : 'btn-primary'}`}
          onClick={handleJoin}
          disabled={!event.isJoined && full}
        >
          {event.isJoined ? '✓ Inscrito' : full ? 'Cheio' : 'Inscrever'}
        </button>
      </div>
    </div>
  );
}
