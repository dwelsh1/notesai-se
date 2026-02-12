export const settingsSelectors = {
  title: '[data-testid="settings-title"]',
  // Main tabs
  generalTab: '[data-testid="settings-tab-general"]',
  dataTab: '[data-testid="settings-tab-data"]',
  aiTab: '[data-testid="settings-tab-ai"]',
  // Data Management sub-tabs
  backupTabButton: '[data-testid="backup-tab-button"]',
  restoreTabButton: '[data-testid="restore-tab-button"]',
  exportTabButton: '[data-testid="export-tab-button"]',
  importTabButton: '[data-testid="import-tab-button"]',
  mediaTabButton: '[data-testid="media-tab-button"]',
  // AI Settings sub-tabs
  aiGeneralSubTab: '[data-testid="settings-ai-subtab-general"]',
  aiPromptsSubTab: '[data-testid="settings-ai-subtab-prompts"]',
  // Content selectors (Data Management)
  backupCard: '[data-testid="settings-backup"]',
  restoreCard: '[data-testid="settings-restore"]',
  exportCard: '[data-testid="settings-export"]',
  importCard: '[data-testid="settings-import"]',
  mediaCard: '[data-testid="settings-media"]',
  // Legacy aliases for Playwright
  importSubTab: '[data-testid="import-tab-button"]',
  exportSubTab: '[data-testid="export-tab-button"]',
  backupsSubTab: '[data-testid="backup-tab-button"]',
  backupsCard: '[data-testid="settings-backup"]',
  importFile: '[data-testid="import-file"]',
  importStatus: '[data-testid="import-status"]',
  exportStatus: '[data-testid="export-status"]',
  generalCard: '[data-testid="settings-general"]',
}

export const toastSelectors = {
  container: '[data-testid="toast-container"]',
  success: '[data-testid="toast-success"]',
  error: '[data-testid="toast-error"]',
  info: '[data-testid="toast-info"]',
  message: '[data-testid="toast-message"]',
  dismiss: '[data-testid="toast-dismiss"]',
}
