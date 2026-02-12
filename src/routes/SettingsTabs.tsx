import { useState } from 'react'
import { SettingsGeneral } from './SettingsGeneral'
import { SettingsAI } from './SettingsAI'
import { SettingsDataManagement } from './SettingsDataManagement'
import { SettingsDiagnostics } from './SettingsDiagnostics'

export type SettingsTab = 'general' | 'templates' | 'ai' | 'tags' | 'data' | 'diagnostics'

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  return (
    <div className="settings-tabs">
      <div className="settings-tabs__header">
        <button
          type="button"
          data-testid="settings-tab-general"
          className={`settings-tabs__tab ${activeTab === 'general' ? 'settings-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General Settings
        </button>
        <button
          type="button"
          data-testid="settings-tab-templates"
          className={`settings-tabs__tab ${activeTab === 'templates' ? 'settings-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button
          type="button"
          data-testid="settings-tab-ai"
          className={`settings-tabs__tab ${activeTab === 'ai' ? 'settings-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          AI Settings
        </button>
        <button
          type="button"
          data-testid="settings-tab-tags"
          className={`settings-tabs__tab ${activeTab === 'tags' ? 'settings-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('tags')}
        >
          Tags
        </button>
        <button
          type="button"
          data-testid="settings-tab-data"
          className={`settings-tabs__tab ${activeTab === 'data' ? 'settings-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data Management
        </button>
        <button
          type="button"
          data-testid="settings-tab-diagnostics"
          className={`settings-tabs__tab ${activeTab === 'diagnostics' ? 'settings-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          Diagnostics
        </button>
      </div>
      <div className="settings-tabs__content">
        {activeTab === 'general' && <SettingsGeneral />}
        {activeTab === 'templates' && (
          <div className="settings-placeholder">Templates coming soon</div>
        )}
        {activeTab === 'ai' && <SettingsAI />}
        {activeTab === 'tags' && <div className="settings-placeholder">Tags coming soon</div>}
        {activeTab === 'data' && <SettingsDataManagement />}
        {activeTab === 'diagnostics' && <SettingsDiagnostics />}
      </div>
    </div>
  )
}
