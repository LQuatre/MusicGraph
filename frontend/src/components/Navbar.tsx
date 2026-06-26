import React from 'react';
import { GitBranch, Search, BarChart3, Home, Library } from 'lucide-react';

export type Tab = 'home' | 'search' | 'stats' | 'library'
  | { type: 'artist'; mbid: string }
  | { type: 'release'; mbid: string }
  | { type: 'recording'; mbid: string };

interface NavbarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const isTabActive = (tabName: string): boolean => {
    if (typeof activeTab === 'string') {
      return activeTab === tabName;
    }
    return false;
  };

  return (
    <nav className="navbar">
      <a
        href="#"
        className="nav-logo"
        onClick={(e) => {
          e.preventDefault();
          setActiveTab('home');
        }}
      >
        <GitBranch size={26} color="#6366f1" />
        MusicGraph
      </a>
      <ul className="nav-links">
        <li>
          <a
            href="#"
            className={`nav-link ${isTabActive('home') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('home');
            }}
          >
            <Home size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Graphe Global
          </a>
        </li>
        <li>
          <a
            href="#"
            className={`nav-link ${isTabActive('library') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('library');
            }}
          >
            <Library size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Médiathèque
          </a>
        </li>
        <li>
          <a
            href="#"
            className={`nav-link ${isTabActive('search') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('search');
            }}
          >
            <Search size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Rechercher / Importer
          </a>
        </li>
        <li>
          <a
            href="#"
            className={`nav-link ${isTabActive('stats') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('stats');
            }}
          >
            <BarChart3 size={18} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Statistiques & Analyses
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
