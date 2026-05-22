import React, { useState, useEffect } from 'react';
import { ratingService } from '../services/api';

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_CLS = ['gold', 'silver', 'bronze'];

export default function Ranking() {
  const [ranking, setRanking]         = useState([]);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [sport, setSport]             = useState('');

  useEffect(() => {
    ratingService.getStats().then(({ data }) => setTotalRatings(data.totalRatings)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    ratingService.getRanking(sport ? { sport } : {})
      .then(({ data }) => setRanking(data))
      .catch(() => setRanking([]))
      .finally(() => setLoading(false));
  }, [sport]);

  return (
    <div className="page">
      <div className="topbar">
        <div className="page-head">
          <h2>Ranking de Jogadores</h2>
          <p>Calculado automaticamente com base nas avaliações recebidas</p>
        </div>
        <div className="topbar-actions">
          <select className="fi" style={{ width: 155, padding: '8px 12px' }}
            value={sport} onChange={(e) => setSport(e.target.value)}>
            <option value="">Geral</option>
            <option value="football">⚽ Futebol</option>
            <option value="padel">🏓 Padel</option>
            <option value="running">🏃 Corrida</option>
            <option value="basketball">🏀 Basquetebol</option>
          </select>
        </div>
      </div>

      <div className="stats-grid sg-3" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-lbl">Jogadores Ativos</div><div className="stat-val sv-g">{ranking.length}</div></div>
        <div className="stat-card"><div className="stat-lbl">Avaliações Totais</div><div className="stat-val sv-b">{totalRatings}</div></div>
        <div className="stat-card"><div className="stat-lbl">Média Geral</div>
          <div className="stat-val sv-o">
            {ranking.length ? (ranking.reduce((s, u) => s + u.avgRating, 0) / ranking.length).toFixed(1) : '—'} ⭐
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty"><span>⏳</span><b>A carregar ranking...</b></div>
        ) : ranking.length === 0 ? (
          <div className="empty"><span>🏆</span><b>Sem jogadores no ranking ainda</b></div>
        ) : (
          <table className="rank-table" style={{ padding: '0 8px' }}>
            <thead>
              <tr>
                <th style={{ width: 50, paddingLeft: 20 }}>#</th>
                <th>Jogador</th>
                <th>Cidade</th>
                <th>Eventos</th>
                <th>Avaliação</th>
                <th>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((u, i) => (
                <tr key={u.id}>
                  <td><div className={`rnum ${MEDAL_CLS[i] || ''}`} style={{ paddingLeft: 10 }}>{MEDALS[i] || (i + 1)}</div></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="ava ava-b" style={{ width: 34, height: 34, fontSize: 12 }}>
                        {u.fullName?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{u.fullName || u.username}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                          {(u.sports || []).map(s => ({ football:'⚽',padel:'🏓',running:'🏃',basketball:'🏀',tennis:'🎾',cycling:'🚴' }[s] || '')).join(' ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--t2)' }}>📍 {u.city || '—'}</td>
                  <td style={{ fontSize: 13.5, fontWeight: 500 }}>{u.eventsCount || 0}</td>
                  <td>
                    <span style={{ color: 'var(--yellow)' }}>{'★'.repeat(Math.round(u.avgRating || 0))}</span>
                    <span style={{ fontSize: 13, marginLeft: 5, fontWeight: 600 }}>{(u.avgRating || 0).toFixed(1)}</span>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--g)', fontWeight: 700 }}>{u.rankingPoints || 0}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
