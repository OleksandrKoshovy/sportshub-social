import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Layout        from './components/Layout';
import Landing       from './pages/Landing';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Feed          from './pages/Feed';
import EventDetail   from './pages/EventDetail';
import CreateEvent   from './pages/CreateEvent';
import Ranking       from './pages/Ranking';
import Profile       from './pages/Profile';
import Admin         from './pages/Admin';

// Rota protegida — redireciona para login se não autenticado
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Rota de admin — só para role=admin
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/feed" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Páginas sem sidebar */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Páginas com sidebar */}
      <Route element={<Layout />}>
        <Route path="/"       element={<Landing />} />
        <Route path="/feed"   element={<Feed />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/ranking" element={<Ranking />} />

        {/* Rotas protegidas */}
        <Route path="/create" element={
          <PrivateRoute><CreateEvent /></PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute><Admin /></AdminRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
