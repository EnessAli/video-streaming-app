/*
  Navbar — top navigation bar
  Logo, page links, user info and logout button.
  Shows login/register links when not authenticated
*/
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">🎬</span>
            <span className="hidden sm:inline">VideoStream</span>
          </Link>

          {/* desktop menu */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/" className="hover:text-blue-400 transition-colors">
                  Dashboard
                </Link>
                {(user.role === 'editor' || user.role === 'admin') && (
                  <Link to="/upload" className="hover:text-blue-400 transition-colors">
                    Upload
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="hover:text-blue-400 transition-colors">
                    Admin Panel
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-700">
                  <span className="text-sm text-gray-400">
                    {user.username}
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 rounded-full">
                      {user.role}
                    </span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="hover:text-blue-400 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded transition-colors">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* mobile menu content */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {user ? (
              <>
                <Link to="/" className="block py-2 hover:text-blue-400" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                {(user.role === 'editor' || user.role === 'admin') && (
                  <Link to="/upload" className="block py-2 hover:text-blue-400" onClick={() => setMenuOpen(false)}>
                    Upload
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="block py-2 hover:text-blue-400" onClick={() => setMenuOpen(false)}>
                    Admin Panel
                  </Link>
                )}
                <div className="pt-2 border-t border-gray-700">
                  <span className="text-sm text-gray-400 block mb-2">
                    {user.username} ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 hover:text-blue-400" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="block py-2 hover:text-blue-400" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
