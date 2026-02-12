import { useEffect, useState, useRef } from 'react'
import { defaultConfig, loadConfig, saveConfig } from '../config/appConfig'
import {
  checkAIConnection,
  clearConnectionCache,
  type ConnectionStatus,
} from '../services/aiConnection'
import {
  getCodingModels,
  getChatModels,
  getEmbeddingModels,
  autoSelectCodingModel,
  autoSelectChatModel,
  autoSelectEmbeddingModel,
} from '../services/modelDetection'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Lightbulb } from 'lucide-react'

export function SettingsAIGeneral() {
  const [aiEnabled, setAiEnabled] = useState(defaultConfig.aiEnabled)
  const [aiEndpoint, setAiEndpoint] = useState(defaultConfig.aiEndpoint)
  const [aiModel, setAiModel] = useState(defaultConfig.aiModel)
  const [aiEmbeddingModel, setAiEmbeddingModel] = useState(defaultConfig.aiEmbeddingModel)
  const [aiCodeModel, setAiCodeModel] = useState(defaultConfig.aiCodeModel)
  const [aiChatModel, setAiChatModel] = useState(defaultConfig.aiChatModel)
  const [aiTemperature, setAiTemperature] = useState(defaultConfig.aiTemperature)
  const [aiMaxTokens, setAiMaxTokens] = useState(defaultConfig.aiMaxTokens)

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [embeddingModels, setEmbeddingModels] = useState<string[]>([])
  const [codingModels, setCodingModels] = useState<string[]>([])
  const [chatModels, setChatModels] = useState<string[]>([])

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const config = loadConfig()
    setAiEnabled(config.aiEnabled)
    setAiEndpoint(config.aiEndpoint)
    setAiModel(config.aiModel)
    setAiEmbeddingModel(config.aiEmbeddingModel)
    setAiCodeModel(config.aiCodeModel)
    setAiChatModel(config.aiChatModel)
    setAiTemperature(config.aiTemperature)
    setAiMaxTokens(config.aiMaxTokens)
  }, [])

  // Auto-test connection when endpoint or model changes (debounced)
  useEffect(() => {
    if (!aiEnabled) {
      setConnectionStatus('unknown')
      setConnectionMessage('')
      setAvailableModels([])
      return
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      setIsTesting(true)
      const result = await checkAIConnection(aiEndpoint, aiModel, true)
      setConnectionStatus(result.status)
      setConnectionMessage(result.message)
      setAvailableModels(result.models)
      setIsTesting(false)

      // Auto-select models if current selection not available
      if (result.models.length > 0) {
        const embeddingList = getEmbeddingModels(result.models)
        setEmbeddingModels(embeddingList)
        if (embeddingList.length > 0 && !embeddingList.includes(aiEmbeddingModel)) {
          const autoSelected = autoSelectEmbeddingModel(result.models)
          if (autoSelected) setAiEmbeddingModel(autoSelected)
        }

        const codingList = getCodingModels(result.models)
        setCodingModels(codingList)
        if (codingList.length > 0 && !codingList.includes(aiCodeModel)) {
          const autoSelected = autoSelectCodingModel(result.models)
          if (autoSelected) setAiCodeModel(autoSelected)
        }

        const chatList = getChatModels(result.models)
        setChatModels(chatList)
        if (chatList.length > 0 && !chatList.includes(aiChatModel)) {
          const autoSelected = autoSelectChatModel(result.models)
          if (autoSelected) setAiChatModel(autoSelected)
        }
      }
    }, 500)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [aiEnabled, aiEndpoint, aiModel, aiEmbeddingModel, aiCodeModel, aiChatModel])

  const handleTestConnection = async () => {
    setIsTesting(true)
    clearConnectionCache()
    const result = await checkAIConnection(aiEndpoint, aiModel, false)
    setConnectionStatus(result.status)
    setConnectionMessage(result.message)
    setAvailableModels(result.models)
    setIsTesting(false)

    if (result.models.length > 0) {
      const embeddingList = getEmbeddingModels(result.models)
      setEmbeddingModels(embeddingList)
      if (embeddingList.length > 0) {
        const autoSelected = autoSelectEmbeddingModel(result.models)
        if (autoSelected && !embeddingList.includes(aiEmbeddingModel)) {
          setAiEmbeddingModel(autoSelected)
        }
      }

      const codingList = getCodingModels(result.models)
      setCodingModels(codingList)
      if (codingList.length > 0) {
        const autoSelected = autoSelectCodingModel(result.models)
        if (autoSelected && !codingList.includes(aiCodeModel)) {
          setAiCodeModel(autoSelected)
        }
      }

      const chatList = getChatModels(result.models)
      setChatModels(chatList)
      if (chatList.length > 0) {
        const autoSelected = autoSelectChatModel(result.models)
        if (autoSelected && !chatList.includes(aiChatModel)) {
          setAiChatModel(autoSelected)
        }
      }
    }
  }

  const handleSave = () => {
    saveConfig({
      ...loadConfig(),
      aiEnabled,
      aiEndpoint: aiEndpoint.trim() || defaultConfig.aiEndpoint,
      aiModel: aiModel.trim(),
      aiEmbeddingModel: aiEmbeddingModel.trim(),
      aiCodeModel: aiCodeModel.trim(),
      aiChatModel: aiChatModel.trim(),
      aiTemperature: Math.max(0, Math.min(1, aiTemperature)),
      aiMaxTokens: Math.max(100, Math.min(4000, aiMaxTokens)),
    })
  }

  const handleReset = () => {
    setAiEnabled(defaultConfig.aiEnabled)
    setAiEndpoint(defaultConfig.aiEndpoint)
    setAiModel(defaultConfig.aiModel)
    setAiEmbeddingModel(defaultConfig.aiEmbeddingModel)
    setAiCodeModel(defaultConfig.aiCodeModel)
    setAiChatModel(defaultConfig.aiChatModel)
    setAiTemperature(defaultConfig.aiTemperature)
    setAiMaxTokens(defaultConfig.aiMaxTokens)
    saveConfig({
      ...loadConfig(),
      ...defaultConfig,
    })
  }

  const handleClearCache = () => {
    clearConnectionCache()
    setConnectionStatus('unknown')
    setConnectionMessage('')
    setAvailableModels([])
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle2 size={16} className="settings-ai__status-icon--connected" />
      case 'disconnected':
        return <XCircle size={16} className="settings-ai__status-icon--disconnected" />
      case 'connecting':
        return <Loader2 size={16} className="settings-ai__status-icon--connecting spinning" />
      default:
        return <AlertCircle size={16} className="settings-ai__status-icon--unknown" />
    }
  }

  return (
    <div className="settings-tab-content" data-testid="settings-ai-general">
      <h2>General</h2>

      <div className="settings-section">
        <div className="settings-ai__enable">
          <div>
            <label className="settings-ai__enable-label">Enable AI Features</label>
            <p className="settings-ai__help-text">Turn AI-powered editing commands on or off</p>
          </div>
          <label className="settings-ai__toggle">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
            />
            <span className="settings-ai__toggle-slider" />
          </label>
        </div>
      </div>

      <div className="settings-section">
        <label className="settings-field">
          LM Studio Endpoint
          <input
            type="url"
            value={aiEndpoint}
            onChange={(e) => setAiEndpoint(e.target.value)}
            placeholder={defaultConfig.aiEndpoint}
            disabled={!aiEnabled}
          />
          <p className="settings-ai__help-text">
            The URL of your local LM Studio server (default: {defaultConfig.aiEndpoint})
          </p>
        </label>
      </div>

      <div className="settings-section">
        <div className="settings-ai__connection-status">
          <div className="settings-ai__status-header">
            <div className="settings-ai__status-indicator">
              {getStatusIcon()}
              <span>Connection Status</span>
            </div>
            <button
              type="button"
              className="settings-ai__test-button"
              onClick={handleTestConnection}
              disabled={!aiEnabled || isTesting}
              title="Test connection to LM Studio"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
          {connectionMessage && (
            <p
              className={`settings-ai__status-message settings-ai__status-message--${connectionStatus}`}
            >
              {connectionMessage}
            </p>
          )}
          {connectionStatus === 'connected' && availableModels.length > 0 && (
            <p className="settings-ai__model-count">{availableModels.length} model(s) available</p>
          )}
        </div>
      </div>

      <div className="settings-section">
        <label className="settings-field">
          Model Selection
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            disabled={!aiEnabled || availableModels.length === 0}
          >
            <option value="">Auto-select first available model</option>
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <p className="settings-ai__help-text">
            Choose which model to use for AI operations. Leave as "Auto-select" to use the first
            available model.
          </p>
          {availableModels.length > 0 && (
            <p className="settings-ai__model-count">{availableModels.length} model(s) available</p>
          )}
        </label>
      </div>

      <div className="settings-section">
        <label className="settings-field">
          Embedding Model
          <select
            value={aiEmbeddingModel}
            onChange={(e) => setAiEmbeddingModel(e.target.value)}
            disabled={!aiEnabled || embeddingModels.length === 0}
          >
            {embeddingModels.length === 0 ? (
              <option>No embedding models available</option>
            ) : (
              <>
                <option value="">Auto-select nomic-embed-text-v1.5</option>
                {embeddingModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </>
            )}
          </select>
          <p className="settings-ai__help-text">
            Model used for generating page embeddings for semantic search. Default:
            nomic-embed-text-v1.5
          </p>
          {embeddingModels.length > 0 && (
            <p className="settings-ai__model-count">
              {embeddingModels.length} embedding model(s) available
            </p>
          )}
        </label>
      </div>

      <div className="settings-section">
        <label className="settings-field">
          Code Model
          <select
            value={aiCodeModel}
            onChange={(e) => setAiCodeModel(e.target.value)}
            disabled={!aiEnabled || codingModels.length === 0}
          >
            {codingModels.length === 0 ? (
              <option>No coding models available</option>
            ) : (
              <>
                <option value="">Auto-detect Qwen3 Coder or best available coding model</option>
                {codingModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </>
            )}
          </select>
          <p className="settings-ai__help-text">
            Model used for code-specific AI commands. Default: Auto-detect Qwen3 Coder or best
            available coding model.
          </p>
          {codingModels.length > 0 && (
            <p className="settings-ai__model-count">
              {codingModels.length} coding model(s) available
            </p>
          )}
        </label>
      </div>

      <div className="settings-section">
        <label className="settings-field">
          Chat Model
          <select
            value={aiChatModel}
            onChange={(e) => setAiChatModel(e.target.value)}
            disabled={!aiEnabled || chatModels.length === 0}
          >
            {chatModels.length === 0 ? (
              <option>No chat models available</option>
            ) : (
              <>
                <option value="">Auto-detect best chat model or use default AI model</option>
                {chatModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </>
            )}
          </select>
          <p className="settings-ai__help-text">
            Model used for AI chat feature. Default: Auto-detect best chat model or use default AI
            model.
          </p>
          {chatModels.length > 0 && (
            <p className="settings-ai__model-count">{chatModels.length} chat model(s) available</p>
          )}
        </label>
      </div>

      <div className="settings-section settings-section--advanced">
        <h3>Advanced Settings</h3>
        <label className="settings-field">
          Temperature
          <div className="settings-ai__slider-container">
            <span className="settings-ai__slider-label">0.0 (precise)</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={aiTemperature}
              onChange={(e) => setAiTemperature(Number(e.target.value))}
              disabled={!aiEnabled}
              className="settings-ai__slider"
            />
            <span className="settings-ai__slider-label">1.0 (creative)</span>
            <span className="settings-ai__slider-value">{aiTemperature.toFixed(2)}</span>
          </div>
          <p className="settings-ai__help-text">
            Controls randomness. Lower values (0.1-0.3) for factual tasks, higher (0.7-0.9) for
            creative writing.
          </p>
        </label>
        <label className="settings-field">
          Max Tokens
          <input
            type="number"
            min={100}
            max={4000}
            step={50}
            value={aiMaxTokens}
            onChange={(e) => setAiMaxTokens(Number(e.target.value))}
            disabled={!aiEnabled}
          />
          <p className="settings-ai__help-text">
            Maximum length of AI responses (100-4000). Higher values allow longer outputs but take
            more time.
          </p>
        </label>
      </div>

      <div className="settings-section settings-ai__tip-box">
        <div className="settings-ai__tip-header">
          <Lightbulb size={16} />
          <strong>Tip: Getting Started</strong>
        </div>
        <ul className="settings-ai__tip-list">
          <li>Install LM Studio from lmstudio.ai</li>
          <li>Load a model (e.g., qwen3-coder-30b, llama-3.1-8b)</li>
          <li>Start the local server in LM Studio</li>
          <li>Test the connection above to verify it works</li>
          <li>Use Ctrl/Cmd+Shift+A or slash commands (/ai-*) in the editor</li>
        </ul>
      </div>

      <div className="settings-ai__actions">
        <button
          type="button"
          className="settings-ai__clear-cache-button"
          onClick={handleClearCache}
          title="Clear connection cache"
        >
          Clear Cache
        </button>
        <button
          type="button"
          className="settings-ai__reset-button"
          onClick={handleReset}
          title="Reset all AI settings to defaults"
        >
          Reset to Defaults
        </button>
        <button
          type="button"
          className="settings-ai__save-button"
          onClick={handleSave}
          title="Save AI settings"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}
