import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Settings, LogOut, Menu, X, Flower } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const isEmFormacao = user?.role === 'em_formacao';

  const NavItems = () => (
    <>
      <NavLink to="/formacao" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
        <BookOpen size={20} />
        <span>Ambiente de Estudos</span>
      </NavLink>

      {!isEmFormacao && (
        <>
          <NavLink to="/escalas" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
            <Calendar size={20} />
            <span>Escalas</span>
          </NavLink>
        </>
      )}

      {user?.role === 'ADMIN' && (
        <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
          <Settings size={20} />
          <span>Administração</span>
        </NavLink>
      )}
    </>
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Flower size={32} color="var(--color-primary)" style={{ margin: '0 auto' }} />
          <h2>Servas do Altar</h2>
        </div>
        <nav className="sidebar-nav">
          <NavItems />
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout">
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      <div className="mobile-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Flower size={24} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-primary)' }}>Servas do Altar</h2>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', padding: '5px' }}>
          <Menu size={28} />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}></div>
      )}

      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px 10px' }}>
          <button onClick={closeMenu} style={{ background: 'none', border: 'none', color: 'var(--color-text-main)', padding: '5px' }}>
            <X size={28} />
          </button>
        </div>
        <nav className="sidebar-nav">
          <NavItems />
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout">
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </div>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
