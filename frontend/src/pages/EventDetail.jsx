import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService, ratingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PhotoUpload from '../components/PhotoUpload';
import StarRating from '../components/StarRating';

const SPORT_CFG = {
  football:   { label: 'Futebol',     icon: '⚽', cls: 'b-football' },
  padel:      { label: 'Padel',       icon: '🏓', cls: 'b-padel' },
  running:    { label: 'Corrida',     icon: '🏃', cls: 'b-running' },
  basketball: { label: 'Basquetebol',icon: '🏀', cls: 'b-basketball' },
  tennis:     { label: 'Ténis',       icon: '🎾', cls: 'b-tennis' },
  cycling:    { label: 'Ciclismo',    icon: '🚴', cls: 'b-cycling' },
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [event, setEvent]               = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [joining, setJoining]           = useState(false);
  const [showUpload, setShowUpload]     = useState(false);
  const [photos, setPhotos]             = useState([]);

  // Avaliação
  const [rateTarget, setRateTarget]   = useState('');
  const [rateScore, setRateScore]     = useState(0);
  const [rateComment, setRateComment] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const load = async () => {
    try {
      const [evRes, ptRes] = await Promise.all([
        eventService.getById(id),
        eventService.getParticipants(id).catch(() => ({ data: [] })),
      ]);
      setEvent(evRes.data);
      setParticipants(ptRes.data);
      setPhotos(evRes.data.photoUrls || []);
    } catch {
      toast.error('Evento não encontrado.');
      navigate('/feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleJoin = async () => {
    if (!user) { navigate('/login'); return; }
    setJoining(true);
    try {
      if (event.isJoined) {
        await eventService.leave(id);
        toast.success('Inscrição cancelada.');
      } else {
        await eventService.join(id);
        toast.success('Inscrito com sucesso!');
      }
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao processar inscrição.');
    } finally {
      setJoining(false);
    }
  };

  const handleRating = async () => {
    if (!rateTarget || !rateScore) {
      toast.error('Seleciona um participante e uma classificação.');
      return;
    }
    setSubmitting(true);
    try {
      await ratingService.submit({
        eventId:     id,
        ratedUserId: rateTarget,
        score:       rateScore,
        comment:     rateComment,
      });
      toast.success('Avaliação enviada! Ranking atualizado.');
      setRateTarget(''); setRateScore(0); setRateComment('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><div className="empty"><span>⏳</span><b>A carregar...</b></div></div>;
  if (!event)  return null;

  const sport   = SPORT_CFG[event.sport] || SPORT_CFG.football;
  const isPast  = new Date(event.dateTime) < new Date();
  const full    = event.currentParticipants >= event.maxParticipants;
  const pct     = Math.min(100, Math.round((event.currentParticipants / event.maxParticipants) * 100));

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/feed')}>← Voltar ao Feed</button>
      </div>

      <div className="g2" style={{ alignItems: 'flex-start' }}>
        {/* Coluna principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Hero do evento */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className={`badge ${sport.cls}`}>{sport.icon} {sport.label}</span>
              <span className={`badge ${isPast ? 'b-warn' : 'b-ok'}`}>{isPast ? 'Concluído' : 'Ativo'}</span>
            </div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700, marginBottom: 16, lineHeight: 1.3 }}>
              {event.title}
            </h2>
            <div className="dgrid">
              <div className="dbox"><div className="dlbl">📅 Data</div><div className="dval">{new Date(event.date + 'T12:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
              <div className="dbox"><div className="dlbl">⏰ Hora</div><div className="dval">{event.time}</div></div>
              <div className="dbox"><div className="dlbl">📍 Local</div><div className="dval">{event.location}</div></div>
              <div className="dbox"><div className="dlbl">👥 Vagas</div><div className="dval">{event.currentParticipants}/{event.maxParticipants}{full ? ' (Cheio)' : ''}</div></div>
            </div>

            {/* Barra de progresso */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 5 }}>{pct}% das vagas ocupadas</div>
              <div className="pt" style={{ height: 6 }}>
                <div className={`pf ${pct >= 100 ? 'pf-r' : pct >= 75 ? 'pf-o' : 'pf-g'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="sec-lbl">Descrição</div>
            <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 20 }}>{event.description}</p>

            {/* Botão de inscrição */}
            {!isPast && (
              <button
                className={`btn ${event.isJoined ? 'btn-ghost' : 'btn-primary'}`}
                onClick={handleJoin}
                disabled={joining || (!event.isJoined && full)}
                style={{ width: '100%', padding: 12, fontSize: 15 }}
              >
                {joining ? 'A processar...' : event.isJoined ? '✕ Cancelar Inscrição' : full ? 'Sem vagas disponíveis' : '✓ Inscrever-me'}
              </button>
            )}
          </div>

          {/* Galeria de fotos */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="sec-lbl" style={{ marginBottom: 0 }}>Galeria de Fotos ({photos.length})</div>
              {user && event.isJoined && (
                <button className="btn btn-ghost btn-xs" onClick={() => setShowUpload(s => !s)}>
                  + Adicionar foto
                </button>
              )}
            </div>

            {showUpload && (
              <div style={{ marginBottom: 16 }}>
                <PhotoUpload
                  eventId={id}
                  onUploaded={(url) => {
                    setPhotos(prev => [...prev, url]);
                    setShowUpload(false);
                  }}
                />
              </div>
            )}

            {photos.length > 0 ? (
              <div className="photo-grid">
                {photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="photo-thumb">
                    <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--t3)', padding: '8px 0' }}>
                Ainda sem fotos — {event.isJoined ? 'adiciona a primeira!' : 'inscreve-te para adicionar fotos.'}
              </div>
            )}
          </div>
        </div>

        {/* Coluna lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Organizador */}
          <div className="card">
            <div className="sec-lbl">Organizador</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="ava ava-g" style={{ width: 44, height: 44, fontSize: 16 }}>
                {event.organizerName?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{event.organizerName}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Criador do evento</div>
              </div>
            </div>
          </div>

          {/* Participantes */}
          <div className="card">
            <div className="sec-lbl">Participantes ({participants.length})</div>
            {participants.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--t3)' }}>Nenhum participante ainda.</div>
            ) : (
              <div>
                {participants.map((p, i) => (
                  <div key={i} className="pt-row">
                    <div className="ava ava-b" style={{ width: 34, height: 34, fontSize: 12 }}>
                      {p.user?.fullName?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.user?.fullName || 'Utilizador'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>{p.user?.city || ''}</div>
                    </div>
                    {p.user?.avgRating > 0 && (
                      <div style={{ color: 'var(--yellow)', fontSize: 12 }}>
                        ★ {p.user.avgRating.toFixed(1)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avaliar — só se evento passado e o utilizador participou */}
          {isPast && user && event.isJoined && (
            <div className="card">
              <div className="sec-lbl">Avaliar Participante</div>
              <div className="fg">
                <label>Participante</label>
                <select className="fi" value={rateTarget} onChange={(e) => setRateTarget(e.target.value)}>
                  <option value="">Seleciona...</option>
                  {participants
                    .filter(p => p.userId !== user.id)
                    .map(p => (
                      <option key={p.userId} value={p.userId}>
                        {p.user?.fullName || p.userId}
                      </option>
                    ))}
                </select>
              </div>
              <div className="fg">
                <label>Classificação</label>
                <StarRating value={rateScore} onChange={setRateScore} size={28} />
              </div>
              <div className="fg" style={{ marginBottom: 12 }}>
                <label>Comentário (opcional)</label>
                <input
                  type="text"
                  className="fi"
                  placeholder="Ex: Excelente fair-play!"
                  value={rateComment}
                  onChange={(e) => setRateComment(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRating}
                disabled={submitting || !rateTarget || !rateScore}
              >
                {submitting ? 'A enviar...' : 'Enviar Avaliação'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
