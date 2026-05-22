import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    toast.success('Sessão terminada.');
    navigate('/');
  };

  const navClass = ({ isActive }) =>
    'nav-btn' + (isActive ? ' active' : '');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 40 }}
        />
      )}

      {/* Botão mobile */}
      <button className="mob-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sb-logo" style={{ cursor: 'pointer' }} onClick={() => { navigate('/'); setSidebarOpen(false); }}>
          <div className="logo">Sports<span>Hub</span></div>
          <div className="logo-tag">Social Platform</div>
        </div>

        <nav className="sb-nav">
          <div className="nav-group">Principal</div>
          <NavLink to="/feed"   className={navClass} onClick={() => setSidebarOpen(false)}>
            <span className="ico">⚡</span>Feed de Eventos
          </NavLink>
          {user && (
            <NavLink to="/my-events" className={navClass} onClick={() => setSidebarOpen(false)}>
              <span className="ico">📋</span>Os Meus Eventos
            </NavLink>
          )}
          {user && (
            <NavLink to="/create" className={navClass} onClick={() => setSidebarOpen(false)}>
              <span className="ico">➕</span>Criar Evento
            </NavLink>
          )}

          <div className="nav-group">Comunidade</div>
          <NavLink to="/ranking" className={navClass} onClick={() => setSidebarOpen(false)}>
            <span className="ico">🏆</span>Ranking
          </NavLink>
          {user && (
            <NavLink to="/profile" className={navClass} onClick={() => setSidebarOpen(false)}>
              <span className="ico">👤</span>O Meu Perfil
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <>
              <div className="nav-group">Gestão</div>
              <NavLink to="/admin" className={navClass} onClick={() => setSidebarOpen(false)}>
                <span className="ico">⚙️</span>Administração
              </NavLink>
            </>
          )}

          <div className="nav-group">Conta</div>
          {user ? (
            <button className="nav-btn" onClick={handleLogout}>
              <span className="ico">🚪</span>Terminar Sessão
            </button>
          ) : (
            <>
              <NavLink to="/login"    className={navClass} onClick={() => setSidebarOpen(false)}>
                <span className="ico">🔑</span>Login
              </NavLink>
              <NavLink to="/register" className={navClass} onClick={() => setSidebarOpen(false)}>
                <span className="ico">📝</span>Registar
              </NavLink>
            </>
          )}
        </nav>

        {user && (
          <div className="sb-user" onClick={() => { navigate('/profile'); setSidebarOpen(false); }}>
            <div className="ava ava-g" style={{ width: 36, height: 36, fontSize: 13 }}>
              {user.username?.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user.fullName || user.username}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                {user.role === 'admin' ? 'Admin' : 'Utilizador'} · {user.city || 'Portugal'}
              </div>
            </div>
            <span style={{ fontSize: 16, color: 'var(--t3)' }}>›</span>
          </div>
        )}
      </aside>

      {/* Conteúdo principal */}
      <main style={{ flex: 1, marginLeft: 248, minHeight: '100vh' }}>
        <Outlet />
      </main>

      {/* Modal confirmação logout */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card" style={{ width: 340, textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🚪</div>
            <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Terminar Sessão?
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', marginBottom: 24 }}>
              Tens a certeza que queres sair da tua conta?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" style={{ flex: 1, padding: 10 }}
                onClick={() => setShowLogoutModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" style={{ flex: 1, padding: 10, background: '#ef4444', borderColor: '#ef4444' }}
                onClick={confirmLogout}>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
