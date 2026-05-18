import React, { useState, useEffect } from 'react';
import { userService, ratingService, uploadService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ALL_SPORTS = ['football','padel','running','basketball','tennis','cycling'];
const SPORT_LABELS = {
  football:'⚽ Futebol', padel:'🏓 Padel', running:'🏃 Corrida',
  basketball:'🏀 Basquetebol', tennis:'🎾 Ténis', cycling:'🚴 Ciclismo',
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ fullName:'', city:'', sports:[] });

  useEffect(() => {
    Promise.all([
      userService.getMe(),
      ratingService.getByUser(user.id),
    ]).then(([pRes, rRes]) => {
      setProfile(pRes.data);
      setReviews(rRes.data);
      setForm({ fullName: pRes.data.fullName, city: pRes.data.city || '', sports: pRes.data.sports || [] });
    }).finally(() => setLoading(false));
  }, [user.id]);

  const toggleSport = (s) => setForm(f => ({
    ...f,
    sports: f.sports.includes(s) ? f.sports.filter(x => x !== s) : [...f.sports, s],
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await userService.updateProfile(form);
      updateUser(data);
      setProfile(data);
      toast.success('Perfil guardado com sucesso!');
    } catch (err) {
      toast.error('Erro ao guardar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { data } = await uploadService.avatar(file);
      updateUser({ avatarUrl: data.avatarUrl });
      toast.success('Foto de perfil atualizada!');
    } catch {
      toast.error('Erro ao carregar a foto.');
    }
  };

  if (loading) return <div className="page"><div className="empty"><span>⏳</span><b>A carregar perfil...</b></div></div>;

  return (
    <div className="page">
      <div className="topbar">
        <div className="page-head"><h2>O Meu Perfil</h2></div>
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'A guardar...' : '💾 Guardar alterações'}
          </button>
        </div>
      </div>

      {/* Hero do perfil */}
      <div className="profile-hero">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar"
              style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--g)' }} />
          ) : (
            <div className="ava ava-g" style={{ width: 84, height: 84, fontSize: 28, borderWidth: 3 }}>
              {(form.fullName || user.username || '??').slice(0, 2).toUpperCase()}
            </div>
          )}
          <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--g)', borderRadius: '50%',
            width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 13 }} title="Alterar foto">
            📷
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </label>
        </div>
        <div style={{ flex: 1 }}>
          <div className="pname">{form.fullName || user.username}</div>
          <div className="phandle">@{profile?.username} · {form.city || 'Portugal'}</div>
          <div className="ptags">
            {form.sports.map(s => <span key={s} className="tag">{SPORT_LABELS[s]}</span>)}
          </div>
          <div className="stats-grid sg-3" style={{ marginTop: 18, marginBottom: 0 }}>
            <div className="stat-card" style={{ padding: '12px 16px' }}>
              <div className="stat-lbl">Eventos</div>
              <div className="stat-val sv-g" style={{ fontSize: 26 }}>{profile?.eventsCount || 0}</div>
            </div>
            <div className="stat-card" style={{ padding: '12px 16px' }}>
              <div className="stat-lbl">Avaliação</div>
              <div className="stat-val sv-b" style={{ fontSize: 26 }}>
                {(profile?.avgRating || 0).toFixed(1)} ⭐
              </div>
            </div>
            <div className="stat-card" style={{ padding: '12px 16px' }}>
              <div className="stat-lbl">Pontos</div>
              <div className="stat-val sv-o" style={{ fontSize: 26 }}>{profile?.rankingPoints || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="g2">
        {/* Informação pessoal */}
        <div>
          <div className="sec-lbl">Informação Pessoal</div>
          <div className="card">
            <div className="fg"><label>Nome completo</label>
              <input className="fi" value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} /></div>
            <div className="fg"><label>Email</label>
              <input className="fi" value={profile?.email || ''} disabled style={{ opacity: 0.6 }} /></div>
            <div className="fg" style={{ marginBottom: 0 }}><label>Cidade</label>
              <input className="fi" placeholder="Lisboa" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} /></div>
          </div>
          <div className="sec-lbl" style={{ marginTop: 20 }}>Desportos Favoritos</div>
          <div className="card">
            <div className="sports-pick">
              {ALL_SPORTS.map(s => (
                <div key={s} className={`sport-opt ${form.sports.includes(s) ? 'on' : ''}`} onClick={() => toggleSport(s)}>
                  {SPORT_LABELS[s]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avaliações recebidas */}
        <div>
          <div className="sec-lbl">Avaliações Recebidas ({reviews.length})</div>
          <div className="card">
            {reviews.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--t3)' }}>Ainda sem avaliações.</div>
            ) : reviews.map((r, i) => (
              <div key={i} style={{ padding: '11px 0', borderBottom: '1px solid var(--bd)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{r.from || 'Utilizador'}</span>
                  <span style={{ color: 'var(--yellow)' }}>{'★'.repeat(r.score)}</span>
                </div>
                {r.comment && <div style={{ fontSize: 12.5, color: 'var(--t2)' }}>{r.comment}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
