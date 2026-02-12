import { useState } from 'react'
import { SettingsAIGeneral } from './SettingsAIGeneral'
import { SettingsAIPrompts } from './SettingsAIPrompts'

export function SettingsAI() {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'prompts'>('general')

  return (
    <div className="settings-ai">
      <div className="settings-ai__sub-tabs">
        <button
          type="button"
          data-testid="settings-ai-subtab-general"
          className={`settings-ai__sub-tab ${activeSubTab === 'general' ? 'settings-ai__sub-tab--active' : ''}`}
          onClick={() => setActiveSubTab('general')}
        >
          General
        </button>
        <button
          type="button"
          data-testid="settings-ai-subtab-prompts"
          className={`settings-ai__sub-tab ${activeSubTab === 'prompts' ? 'settings-ai__sub-tab--active' : ''}`}
          onClick={() => setActiveSubTab('prompts')}
        >
          Prompts
        </button>
      </div>
      <div className="settings-ai__content">
        {activeSubTab === 'general' && <SettingsAIGeneral />}
        {activeSubTab === 'prompts' && <SettingsAIPrompts />}
      </div>
    </div>
  )
}
