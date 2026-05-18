import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Sessão terminada.');
    navigate('/login');
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
        <div className="sb-logo">
          <div className="logo">Sports<span>Hub</span></div>
          <div className="logo-tag">Social Platform</div>
        </div>

        <nav className="sb-nav">
          <div className="nav-group">Principal</div>
          <NavLink to="/"       className={navClass} end onClick={() => setSidebarOpen(false)}>
            <span className="ico">🏠</span>Início
          </NavLink>
          <NavLink to="/feed"   className={navClass} onClick={() => setSidebarOpen(false)}>
            <span className="ico">⚡</span>Feed de Eventos
          </NavLink>
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
    </div>
  );
}
