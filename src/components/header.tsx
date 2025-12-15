import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  scrollY: number;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

/** Explicit route mappings — no more fragile string manipulation */
const navItems = [
  { label: 'Home', to: '/home' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Classify', to: '/classify' },
  { label: 'Design', to: '/design-kolam' },
];

export const Header: React.FC<HeaderProps> = ({ scrollY, isMenuOpen, setIsMenuOpen }) => {
  const location = useLocation();

  /** Check if the current route matches (or starts with) the nav item path */
  const isActive = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-500 ${scrollY > 20 ? 'bg-amber-50/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 sm:px-6 md:px-10 py-4">
          <div className="relative flex justify-between items-center w-full">
            {/* Left: Logo */}
            <Link to="/home" className="flex items-center space-x-3 group cursor-pointer z-10" onClick={() => setIsMenuOpen(false)}>
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <svg width="32" height="32" viewBox="0 0 100 100" className="relative animate-spin-slow text-amber-700">
                  <circle cx="50" cy="30" r="18" stroke="currentColor" strokeWidth="6" fill="none" />
                  <circle cx="50" cy="70" r="18" stroke="currentColor" strokeWidth="6" fill="none" />
                  <circle cx="30" cy="50" r="18" stroke="currentColor" strokeWidth="6" fill="none" />
                  <circle cx="70" cy="50" r="18" stroke="currentColor" strokeWidth="6" fill="none" />
                  <circle cx="50" cy="50" r="6" fill="currentColor" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-amber-900 font-serif">APARNA BINDU</h1>
            </Link>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-8">
              {navItems.map((item) => (
                <Link 
                  key={item.label}
                  to={item.to} 
                  className="relative group py-2"
                >
                  <span className={`font-medium transition-colors ${
                    isActive(item.to) 
                      ? 'text-amber-600' 
                      : 'text-amber-800 group-hover:text-amber-600'
                  }`}>
                    {item.label}
                  </span>
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-300 ${
                    isActive(item.to) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
              ))}
            </nav>

            {/* Right: Mobile Menu Toggle */}
            <div className="flex items-center space-x-4 z-10">
              <button 
                className="lg:hidden p-2 rounded-lg hover:bg-amber-100 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown — single source of truth, rendered only here */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[64px] bg-amber-50/95 backdrop-blur-lg shadow-xl z-40 animate-slideDown">
          <nav className="container mx-auto px-6 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                  isActive(item.to)
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'text-amber-800 hover:bg-amber-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};