import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/products" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
              <span className="text-white font-bold text-sm">PC</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
              ProductCatalog
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            <Link
              to="/products"
              id="nav-products"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/products')
                  ? 'bg-brand-500/20 text-brand-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Catalog
            </Link>

            {user && (
              <Link
                to="/create"
                id="nav-create"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/create')
                    ? 'bg-brand-500/20 text-brand-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                Add Product
              </Link>
            )}
          </div>

          {/* Auth Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-slate-400">
                  Hi,{' '}
                  <span className="text-slate-200 font-semibold">{user.name}</span>
                </span>
                <button
                  id="btn-logout"
                  onClick={handleLogout}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" id="nav-login" className="btn-secondary py-2 px-4 text-xs">
                  Login
                </Link>
                <Link to="/signup" id="nav-signup" className="btn-primary py-2 px-4 text-xs">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden py-3 border-t border-white/10 space-y-1">
            <Link to="/products" className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg" onClick={() => setMenuOpen(false)}>
              Catalog
            </Link>
            {user && (
              <Link to="/create" className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg" onClick={() => setMenuOpen(false)}>
                Add Product
              </Link>
            )}
            {user ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/signup" className="block px-4 py-2 text-sm text-brand-400 hover:bg-white/5 rounded-lg" onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
