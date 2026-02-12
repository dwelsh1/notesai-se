import { useState, useMemo, useEffect } from 'react'
import { defaultConfig, loadConfig, saveConfig } from '../config/appConfig'
import {
  commandDefinitions,
  getCommandsByCategory,
  getDefaultPromptContent,
  getDefaultSystemPrompt,
  type CommandId,
} from '../services/promptDefaults'
import { validatePrompt } from '../services/promptValidation'
import { FileText, Code, Pencil } from 'lucide-react'
import type { CustomPrompt } from '../config/appConfig'

export function SettingsAIPrompts() {
  const [selectedCommand, setSelectedCommand] = useState<CommandId | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [customPrompts, setCustomPrompts] = useState(defaultConfig.customPrompts)

  useEffect(() => {
    const config = loadConfig()
    setCustomPrompts(config.customPrompts)
  }, [])

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return commandDefinitions
    }
    const query = searchQuery.toLowerCase()
    return commandDefinitions.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.shortDescription.toLowerCase().includes(query),
    )
  }, [searchQuery])

  const textCommands = useMemo(() => getCommandsByCategory('text'), [])
  const contentCommands = useMemo(() => getCommandsByCategory('content'), [])
  const codeCommands = useMemo(() => getCommandsByCategory('code'), [])

  const selectedCommandDef = selectedCommand
    ? commandDefinitions.find((c) => c.id === selectedCommand)
    : null

  const currentPrompt: CustomPrompt | null = selectedCommand
    ? customPrompts[selectedCommand] || getDefaultPromptContent(selectedCommand)
    : null

  const [editedPrompt, setEditedPrompt] = useState<CustomPrompt | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (selectedCommand && currentPrompt) {
      setEditedPrompt({ ...currentPrompt })
      setHasChanges(false)
    }
  }, [selectedCommand, currentPrompt])

  const validation = useMemo(() => {
    if (!selectedCommand || !editedPrompt) {
      return { isValid: true, errors: [], warnings: [] }
    }
    return validatePrompt(selectedCommand, editedPrompt)
  }, [selectedCommand, editedPrompt])

  const handleSavePrompt = () => {
    if (!selectedCommand || !editedPrompt || !validation.isValid) return

    const updated = { ...customPrompts, [selectedCommand]: editedPrompt }
    setCustomPrompts(updated)
    saveConfig({
      ...loadConfig(),
      customPrompts: updated,
    })
    setHasChanges(false)
  }

  const handleResetPrompt = () => {
    if (!selectedCommand) return

    const updated = { ...customPrompts }
    delete updated[selectedCommand]
    setCustomPrompts(updated)
    saveConfig({
      ...loadConfig(),
      customPrompts: updated,
    })
    setEditedPrompt(getDefaultPromptContent(selectedCommand))
    setHasChanges(false)
  }

  const handleResetAllCode = () => {
    if (!window.confirm('Reset all code-specific prompts to defaults?')) return

    const updated = { ...customPrompts }
    for (const cmd of codeCommands) {
      delete updated[cmd.id]
    }
    setCustomPrompts(updated)
    saveConfig({
      ...loadConfig(),
      customPrompts: updated,
    })
    if (selectedCommand && codeCommands.some((c) => c.id === selectedCommand)) {
      setEditedPrompt(getDefaultPromptContent(selectedCommand))
      setHasChanges(false)
    }
  }

  const insertVariable = (variable: string) => {
    if (!editedPrompt) return
    const newUser = editedPrompt.user + `{{${variable}}}`
    setEditedPrompt({ ...editedPrompt, user: newUser })
    setHasChanges(true)
  }

  const isCustom = selectedCommand ? selectedCommand in customPrompts : false

  return (
    <div className="settings-ai-prompts" data-testid="settings-ai-prompts">
      <div className="settings-ai-prompts__layout">
        <div className="settings-ai-prompts__sidebar">
          <input
            type="text"
            className="settings-ai-prompts__search"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="settings-ai-prompts__command-list">
            {filteredCommands.length === 0 ? (
              <div className="settings-ai-prompts__empty">No commands found</div>
            ) : (
              <>
                {textCommands.filter((c) => filteredCommands.includes(c)).length > 0 && (
                  <div className="settings-ai-prompts__category">
                    <div className="settings-ai-prompts__category-header">
                      <span>TEXT IMPROVEMENT</span>
                    </div>
                    {textCommands
                      .filter((c) => filteredCommands.includes(c))
                      .map((cmd) => (
                        <button
                          key={cmd.id}
                          type="button"
                          className={`settings-ai-prompts__command-item ${
                            selectedCommand === cmd.id
                              ? 'settings-ai-prompts__command-item--active'
                              : ''
                          }`}
                          onClick={() => setSelectedCommand(cmd.id)}
                        >
                          <FileText size={16} />
                          <span>{cmd.name}</span>
                          {cmd.id in customPrompts && (
                            <Pencil size={14} className="settings-ai-prompts__custom-icon" />
                          )}
                        </button>
                      ))}
                  </div>
                )}
                {contentCommands.filter((c) => filteredCommands.includes(c)).length > 0 && (
                  <div className="settings-ai-prompts__category">
                    <div className="settings-ai-prompts__category-header">
                      <span>CONTENT GENERATION</span>
                    </div>
                    {contentCommands
                      .filter((c) => filteredCommands.includes(c))
                      .map((cmd) => (
                        <button
                          key={cmd.id}
                          type="button"
                          className={`settings-ai-prompts__command-item ${
                            selectedCommand === cmd.id
                              ? 'settings-ai-prompts__command-item--active'
                              : ''
                          }`}
                          onClick={() => setSelectedCommand(cmd.id)}
                        >
                          <FileText size={16} />
                          <span>{cmd.name}</span>
                          {cmd.id in customPrompts && (
                            <Pencil size={14} className="settings-ai-prompts__custom-icon" />
                          )}
                        </button>
                      ))}
                  </div>
                )}
                {codeCommands.filter((c) => filteredCommands.includes(c)).length > 0 && (
                  <div className="settings-ai-prompts__category">
                    <div className="settings-ai-prompts__category-header">
                      <span>CODE-SPECIFIC</span>
                      <button
                        type="button"
                        className="settings-ai-prompts__reset-all-button"
                        onClick={handleResetAllCode}
                        title="Reset all code prompts to defaults"
                      >
                        Reset All
                      </button>
                    </div>
                    {codeCommands
                      .filter((c) => filteredCommands.includes(c))
                      .map((cmd) => (
                        <button
                          key={cmd.id}
                          type="button"
                          className={`settings-ai-prompts__command-item ${
                            selectedCommand === cmd.id
                              ? 'settings-ai-prompts__command-item--active'
                              : ''
                          }`}
                          onClick={() => setSelectedCommand(cmd.id)}
                        >
                          <Code size={16} />
                          <span>{cmd.name}</span>
                          {cmd.id in customPrompts && (
                            <Pencil size={14} className="settings-ai-prompts__custom-icon" />
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="settings-ai-prompts__editor">
          {selectedCommandDef && editedPrompt ? (
            <>
              <div className="settings-ai-prompts__header">
                <div>
                  <h3>
                    {selectedCommandDef.name}
                    {isCustom && (
                      <span className="settings-ai-prompts__custom-badge">(Custom)</span>
                    )}
                  </h3>
                  <p>{selectedCommandDef.description}</p>
                </div>
                <div className="settings-ai-prompts__header-actions">
                  {hasChanges && (
                    <button
                      type="button"
                      className="settings-ai-prompts__save-button"
                      onClick={handleSavePrompt}
                      disabled={!validation.isValid}
                      title="Save changes"
                    >
                      Save Changes
                    </button>
                  )}
                  {isCustom && (
                    <button
                      type="button"
                      className="settings-ai-prompts__reset-button"
                      onClick={handleResetPrompt}
                      title="Reset to default"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
              </div>

              <div className="settings-ai-prompts__variables">
                <div className="settings-ai-prompts__variables-label">Available Variables</div>
                <div className="settings-ai-prompts__variables-list">
                  {selectedCommandDef.variables.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      className="settings-ai-prompts__variable-button"
                      onClick={() => insertVariable(variable)}
                      title={`Insert {{${variable}}} at cursor position`}
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
                <p className="settings-ai-prompts__variables-help">
                  Click a variable to insert it at the cursor position
                </p>
              </div>

              {validation.errors.length > 0 && (
                <div className="settings-ai-prompts__validation-error">
                  {validation.errors.map((error, i) => (
                    <div key={i}>{error}</div>
                  ))}
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="settings-ai-prompts__validation-warning">
                  {validation.warnings.map((warning, i) => (
                    <div key={i}>{warning}</div>
                  ))}
                </div>
              )}

              <div className="settings-ai-prompts__prompt-editor">
                <label className="settings-ai-prompts__prompt-label">
                  System Prompt (Optional)
                  <div className="settings-ai-prompts__prompt-actions">
                    <button
                      type="button"
                      className="settings-ai-prompts__use-default-button"
                      onClick={() => {
                        setEditedPrompt({
                          ...editedPrompt,
                          system: getDefaultSystemPrompt(),
                        })
                        setHasChanges(true)
                      }}
                      title="Use default system prompt"
                    >
                      Use Default
                    </button>
                  </div>
                </label>
                <textarea
                  className="settings-ai-prompts__prompt-textarea"
                  value={editedPrompt.system || ''}
                  onChange={(e) => {
                    setEditedPrompt({ ...editedPrompt, system: e.target.value })
                    setHasChanges(true)
                  }}
                  placeholder="The system prompt defines the AI's role and behavior. Leave empty to use the default."
                  rows={6}
                />
              </div>

              <div className="settings-ai-prompts__prompt-editor">
                <label className="settings-ai-prompts__prompt-label">
                  User Prompt<span className="settings-ai-prompts__required">*</span>
                </label>
                <textarea
                  className="settings-ai-prompts__prompt-textarea"
                  value={editedPrompt.user}
                  onChange={(e) => {
                    setEditedPrompt({ ...editedPrompt, user: e.target.value })
                    setHasChanges(true)
                  }}
                  placeholder="The user prompt is the main instruction sent to the AI. Use variables like {{SELECTION}} or {{SCOPE}} to insert content."
                  rows={12}
                  required
                />
                <p className="settings-ai-prompts__prompt-help">
                  The user prompt is the main instruction sent to the AI. Use variables like{' '}
                  {'{{SELECTION}}'} or {'{{SCOPE}}'} to insert content.
                </p>
              </div>
            </>
          ) : (
            <div className="settings-ai-prompts__empty-state">
              <p>Select a command to edit its prompt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
