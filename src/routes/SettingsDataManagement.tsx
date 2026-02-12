import { useState } from 'react'
import { HardDrive, RotateCcw, Download, Upload, Image } from 'lucide-react'
import { SettingsDataBackup } from './SettingsDataBackup'
import { SettingsDataRestore } from './SettingsDataRestore'
import { SettingsDataExport } from './SettingsDataExport'
import { SettingsDataImport } from './SettingsDataImport'
import { SettingsDataMedia } from './SettingsDataMedia'

export type DataManagementSubTab = 'backup' | 'restore' | 'export' | 'import' | 'media'

export function SettingsDataManagement() {
  const [activeSubTab, setActiveSubTab] = useState<DataManagementSubTab>('backup')

  const subTabs: { id: DataManagementSubTab; label: string; icon: React.ReactNode; testId: string }[] = [
    { id: 'backup', label: 'Backup', icon: <HardDrive size={18} aria-hidden />, testId: 'backup-tab-button' },
    { id: 'restore', label: 'Restore', icon: <RotateCcw size={18} aria-hidden />, testId: 'restore-tab-button' },
    { id: 'export', label: 'Export', icon: <Download size={18} aria-hidden />, testId: 'export-tab-button' },
    { id: 'import', label: 'Import', icon: <Upload size={18} aria-hidden />, testId: 'import-tab-button' },
    { id: 'media', label: 'Media', icon: <Image size={18} aria-hidden />, testId: 'media-tab-button' },
  ]

  return (
    <div className="settings-data" data-testid="data-management-settings">
      <div className="settings-data__header">
        <h2 className="settings-data__title">Data Management</h2>
        <p className="settings-data__subtitle">
          Export and import your pages and settings. Manage media files.
        </p>
      </div>
      <div className="settings-data__sub-tabs">
        {subTabs.map(({ id, label, icon, testId }) => (
          <button
            key={id}
            type="button"
            data-testid={testId}
            className={`settings-data__sub-tab ${activeSubTab === id ? 'settings-data__sub-tab--active' : ''}`}
            onClick={() => setActiveSubTab(id)}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="settings-data__content">
        {activeSubTab === 'backup' && <SettingsDataBackup />}
        {activeSubTab === 'restore' && <SettingsDataRestore />}
        {activeSubTab === 'export' && <SettingsDataExport />}
        {activeSubTab === 'import' && <SettingsDataImport />}
        {activeSubTab === 'media' && <SettingsDataMedia />}
      </div>
    </div>
  )
}
