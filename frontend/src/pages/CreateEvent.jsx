// ════════════════ CreateEvent.jsx ════════════════
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CreateEvent() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    title:'', sport:'football', location:'', date:'', time:'', maxParticipants:'', description:'',
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, sport, location, date, time, maxParticipants } = form;
    if (!title || !location || !date || !time || !maxParticipants) {
      toast.error('Preenche todos os campos obrigatórios.'); return;
    }
    setLoading(true);
    try {
      const { data } = await eventService.create({ ...form, maxParticipants: parseInt(form.maxParticipants) });
      toast.success(`Evento "${data.title}" publicado!`);
      navigate(`/events/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar evento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="topbar">
        <div className="page-head"><h2>Criar Evento</h2><p>Preenche os detalhes do teu evento desportivo</p></div>
      </div>
      <div style={{ maxWidth: 620 }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="fg"><label>Nome do Evento *</label>
              <input className="fi" placeholder="Ex: Futebol de Sexta à noite" value={form.title} onChange={set('title')} /></div>
            <div className="form-row">
              <div className="fg"><label>Modalidade *</label>
                <select className="fi" value={form.sport} onChange={set('sport')}>
                  <option value="football">⚽ Futebol</option>
                  <option value="padel">🏓 Padel</option>
                  <option value="running">🏃 Corrida</option>
                  <option value="basketball">🏀 Basquetebol</option>
                  <option value="tennis">🎾 Ténis</option>
                  <option value="cycling">🚴 Ciclismo</option>
                </select></div>
              <div className="fg"><label>Nº Máx. Participantes *</label>
                <input type="number" className="fi" placeholder="14" min="2" max="200"
                  value={form.maxParticipants} onChange={set('maxParticipants')} /></div>
            </div>
            <div className="fg"><label>Local *</label>
              <input className="fi" placeholder="Campo Municipal do Lumiar, Lisboa"
                value={form.location} onChange={set('location')} /></div>
            <div className="form-row">
              <div className="fg"><label>Data *</label>
                <input type="date" className="fi" value={form.date} onChange={set('date')} /></div>
              <div className="fg"><label>Hora *</label>
                <input type="time" className="fi" value={form.time} onChange={set('time')} /></div>
            </div>
            <div className="fg"><label>Descrição</label>
              <textarea className="fi" placeholder="Descreve o evento, nível exigido, o que trazer..."
                value={form.description} onChange={set('description')} /></div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'A publicar...' : '🚀 Publicar Evento'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/feed')}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
