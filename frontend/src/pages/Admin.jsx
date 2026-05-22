import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Admin() {
  const toast = useToast();
  const [users, setUsers]   = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [uRes, eRes, sRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getEvents(),
        adminService.getStats(),
      ]);
      setUsers(uRes.data);
      setEvents(eRes.data);
      setStats(sRes.data);
    } catch {
      toast.error('Erro ao carregar dados de administração.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await adminService.setUserStatus(id, newStatus);
      toast.success(newStatus === 'active' ? 'Utilizador reativado.' : 'Utilizador suspenso.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao alterar estado.');
    }
  };

  const handleCancelEvent = async (id, title) => {
    try {
      await adminService.cancelEvent(id);
      toast.success(`Evento "${title}" cancelado.`);
      load();
    } catch {
      toast.error('Erro ao cancelar evento.');
    }
  };

  if (loading) return <div className="page"><div className="empty"><span>⏳</span><b>A carregar...</b></div></div>;

  return (
    <div className="page">
      <div className="topbar">
        <div className="page-head"><h2>Administração</h2><p>Acesso restrito — apenas administradores</p></div>
      </div>

      <div className="stats-grid sg-4" style={{ marginBottom: 28 }}>
        <div className="stat-card"><div className="stat-lbl">Utilizadores</div><div className="stat-val sv-g">{stats?.totalUsers || users.length}</div><div className="stat-sub">{users.filter(u => u.status === 'blocked').length} suspensos</div></div>
        <div className="stat-card"><div className="stat-lbl">Eventos Ativos</div><div className="stat-val sv-b">{stats?.activeEvents || events.filter(e => e.status === 'active').length}</div></div>
        <div className="stat-card"><div className="stat-lbl">Avaliações</div><div className="stat-val sv-o">{stats?.totalRatings || '—'}</div></div>
        <div className="stat-card"><div className="stat-lbl">Eventos Total</div><div className="stat-val sv-p">{events.length}</div></div>
      </div>

      <div className="g2">
        {/* Utilizadores */}
        <div>
          <div className="sec-lbl">Gestão de Utilizadores</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="adm-t" style={{ width: '100%' }}>
              <thead><tr><th>Utilizador</th><th>Estado</th><th>Ações</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.fullName || u.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{u.email} · {u.eventsCount || 0} eventos</div>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'b-ok' : 'b-err'}`}>
                        {u.status === 'active' ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          className={`btn btn-xs ${u.status === 'active' ? 'btn-danger' : 'btn-ghost'}`}
                          onClick={() => handleUserStatus(u.id, u.status)}
                        >
                          {u.status === 'active' ? 'Suspender' : 'Reativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Eventos */}
        <div>
          <div className="sec-lbl">Gestão de Eventos</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="adm-t" style={{ width: '100%' }}>
              <thead><tr><th>Evento</th><th>Estado</th><th>Ações</th></tr></thead>
              <tbody>
                {events.slice(0, 10).map(e => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{e.organizerName} · {e.currentParticipants}/{e.maxParticipants}</div>
                    </td>
                    <td>
                      {(() => {
                        const isPast = new Date(e.dateTime) < new Date();
                        const label = e.status === 'cancelled' ? 'Cancelado' : isPast ? 'Concluído' : 'Ativo';
                        const cls   = e.status === 'cancelled' ? 'b-err' : isPast ? 'b-warn' : 'b-ok';
                        return <span className={`badge ${cls}`}>{label}</span>;
                      })()}
                    </td>
                    <td>
                      {e.status === 'active' && new Date(e.dateTime) >= new Date() && (
                        <button className="btn btn-xs btn-danger" onClick={() => handleCancelEvent(e.id, e.title)}>
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
