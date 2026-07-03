import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch } from '../components/AnimatedIcon';

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

  const navItems = [
    { id: 'home', label: 'Graphe Global' },
    { id: 'library', label: 'Médiathèque' },
    { id: 'search', label: 'Rechercher / Importer' },
    { id: 'stats', label: 'Statistiques & Analyses' },
  ] as const;

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
        <GitBranch size={22} color="var(--accent-primary)" />
        MusicGraph
      </a>
      <ul className="nav-links">
        {navItems.map((item) => {
          const active = isTabActive(item.id);
          return (
            <li key={item.id} style={{ position: 'relative' }}>
              <a
                href="#"
                className={`nav-link ${active ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem 0.9rem' }}
              >
                <span>{item.label}</span>
                {active && (
                  <motion.span
                    layoutId="active-nav-pill"
                    className="active-nav-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navbar;
