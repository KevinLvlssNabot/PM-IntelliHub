import React, { useState } from 'react';
import { APPS } from './constants.js';
import { useSettings } from './hooks/useSettings.js';
import { Layout } from './components/Layout.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { DigestView } from './components/DigestView.jsx';
import { ChatView } from './components/ChatView.jsx';
import { SourceCards } from './components/SourceCards.jsx';
import { TrendingGamesView } from './components/TrendingGamesView.jsx';

export default function App() {
  const { settings, updateSettings, isFirstRun } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedApp, setSelectedApp] = useState(APPS[0].id);
  const [activeTab, setActiveTab] = useState('digest');

  const handleSaveSettings = (newSettings) => {
    updateSettings(newSettings);
    setShowSettings(false);
  };

  const handleOpenSettings = () => setShowSettings(true);
  const handleCloseSettings = () => setShowSettings(false);

  // First run wizard (full-screen, blocks the app)
  if (isFirstRun) {
    return (
      <SettingsPanel
        settings={settings}
        onSave={handleSaveSettings}
        isWizard
      />
    );
  }

  return (
    <>
      <Layout
        selectedApp={selectedApp}
        onSelectApp={(appId) => {
          setSelectedApp(appId);
          // Reset to digest tab when switching apps
          setActiveTab('digest');
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={handleOpenSettings}
      >
        {activeTab === 'digest' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <DigestView
              settings={settings}
              selectedApp={selectedApp}
              onOpenSettings={handleOpenSettings}
            />
            <SourceCards
              settings={settings}
              selectedApp={selectedApp}
              onOpenSettings={handleOpenSettings}
            />
          </div>
        )}

        {activeTab === 'trending' && (
          <TrendingGamesView
            settings={settings}
            onOpenSettings={handleOpenSettings}
          />
        )}

        {activeTab === 'chat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
            <ChatView
              settings={settings}
              selectedApp={selectedApp}
              onOpenSettings={handleOpenSettings}
            />
          </div>
        )}
      </Layout>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={handleCloseSettings}
        />
      )}
    </>
  );
}
