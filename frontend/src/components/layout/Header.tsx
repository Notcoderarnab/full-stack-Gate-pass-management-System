import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Menu, QrCode, ShieldCheck, Moon, Sun, X } from 'lucide-react';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

const NAV_LINKS = [
  { label: 'Workflow', href: '#workflow' },
  { label: 'Modules', href: '#modules' },
  { label: 'Preview', href: '#preview' },
  { label: 'Development', href: '#development' },
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleDark } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${
          scrolled
            ? 'backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-gray-100/80 dark:border-slate-700/50 shadow-sm'
            : 'bg-transparent'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">

          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
              Gate<span className="text-sky-600 dark:text-sky-400">Pass</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-150"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleDark}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/signin">
              <Button variant="outline" size="sm">
                <LogIn size={15} />
                Login
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                <QrCode size={15} />
                Visitor Desk
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-gray-100 dark:border-slate-800">
            <Link to="/signin">
              <Button variant="outline" size="md" fullWidth>
                <LogIn size={15} />
                Login
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="primary" size="md" fullWidth>
                <QrCode size={15} />
                Visitor Desk
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
