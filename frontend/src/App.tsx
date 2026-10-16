import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import type { Tab } from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Stats from './pages/Stats';
import ArtistDetail from './pages/ArtistDetail';
import Library from './pages/Library';
import ReleaseDetail from './pages/ReleaseDetail';
import RecordingDetail from './pages/RecordingDetail';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const renderContent = () => {
    if (typeof activeTab === 'string') {
      switch (activeTab) {
        case 'home':
          return (
            <Home
              apiUrl={API_URL}
              onInspectArtist={(mbid) => setActiveTab({ type: 'artist', mbid })}
            />
          );
        case 'library':
          return (
            <Library
              apiUrl={API_URL}
              onInspectRelease={(mbid) => setActiveTab({ type: 'release', mbid })}
              onInspectRecording={(mbid) => setActiveTab({ type: 'recording', mbid })}
            />
          );
        case 'search':
          return (
            <Search
              apiUrl={API_URL}
              onInspectArtist={(mbid) => setActiveTab({ type: 'artist', mbid })}
              onInspectRelease={(mbid) => setActiveTab({ type: 'release', mbid })}
              onInspectRecording={(mbid) => setActiveTab({ type: 'recording', mbid })}
            />
          );
        case 'stats':
          return (
            <Stats
              apiUrl={API_URL}
              onInspectArtist={(mbid) => setActiveTab({ type: 'artist', mbid })}
            />
          );
        default:
          return (
            <Home
              apiUrl={API_URL}
              onInspectArtist={(mbid) => setActiveTab({ type: 'artist', mbid })}
            />
          );
      }
    } else if (activeTab) {
      if (activeTab.type === 'artist') {
        return (
          <ArtistDetail
            mbid={activeTab.mbid}
            apiUrl={API_URL}
            onBack={() => setActiveTab('home')}
            onInspectArtist={(mbid) => setActiveTab({ type: 'artist', mbid })}
          />
        );
      } else if (activeTab.type === 'release') {
        return (
          <ReleaseDetail
            mbid={activeTab.mbid}
            apiUrl={API_URL}
            onBack={() => setActiveTab('library')}
            onInspectArtist={(mbid) => setActiveTab({ type: 'artist', mbid })}
            onInspectRecording={(mbid) => setActiveTab({ type: 'recording', mbid })}
          />
        );
      } else if (activeTab.type === 'recording') {
        return (
          <RecordingDetail
            mbid={activeTab.mbid}
            apiUrl={API_URL}
            onBack={() => setActiveTab('library')}
            onInspectArtist={(mbid) => setActiveTab({ type: 'artist', mbid })}
            onInspectRelease={(mbid) => setActiveTab({ type: 'release', mbid })}
          />
        );
      }
    }
  };

  const getTabKey = (tab: Tab): string => {
    if (typeof tab === 'string') {
      return tab;
    }
    return `${tab.type}-${tab.mbid}`;
  };

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content" style={{ position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={getTabKey(activeTab)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
