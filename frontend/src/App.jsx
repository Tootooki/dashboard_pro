import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [config, setConfig] = useState({
    // Amazon SP API
    amazon_sp_client_id: '',
    amazon_sp_client_secret: '',
    amazon_sp_refresh_token: '',
    amazon_sp_aws_access_key: '',
    amazon_sp_aws_secret_key: '',
    amazon_sp_role_arn: '',

    // Amazon Ads API
    amazon_ads_client_id: '',
    amazon_ads_client_secret: '',
    amazon_ads_refresh_token: '',
    amazon_ads_profile_id: '',

    // Google & Others
    google_sheet_api: '',
    google_drive_api: '',
    google_sheet_link: '',
    google_drive_link: '',
    slack_api: '',
    telegram_api: '',
    whatsapp_api: '',
    walmart_api: '',
    tiktok_store_api: '',
    tiktok_posting_api: '',
    gmail_api: '',

    // Automation Settings
    slack_channel_id: '',
    notification_preference: 'telegram',
  })

  const [bulkText, setBulkText] = useState('')
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [status, setStatus] = useState('Online')
  const [lastAction, setLastAction] = useState('Ready')
  const [currentTask, setCurrentTask] = useState(null)
  const [taskProgress, setTaskProgress] = useState(0)
  const [taskMessage, setTaskMessage] = useState('')
  const [taskResult, setTaskResult] = useState('')

  // Load configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('https://dashboard-pro-2464.onrender.com/api/load-config')
        if (res.ok) {
          const data = await res.json()
          if (Object.keys(data).length > 0) {
            setConfig(prev => ({ ...prev, ...data }))
            setLastAction('Configuration loaded ✅')
          }
        }
      } catch (err) {
        setLastAction('Error loading configuration ❌')
      }
    }
    fetchConfig()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setConfig(prev => ({ ...prev, [name]: value }))
  }

  const handleBulkImport = () => {
    const lines = bulkText.split('\n')
    const newConfig = { ...config }
    let importedCount = 0

    lines.forEach(line => {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const cleanKey = parts[0].trim().replace(/^[^\w]+/, '').toLowerCase()
        const value = parts.slice(1).join(':').trim()

        // Map keys to config properties
        const mapping = {
          'amazon_sp_client_id': 'amazon_sp_client_id',
          'amazon_sp_client_secret': 'amazon_sp_client_secret',
          'amazon_sp_refresh_token': 'amazon_sp_refresh_token',
          'amazon_sp_aws_access_key': 'amazon_sp_aws_access_key',
          'amazon_sp_aws_secret_key': 'amazon_sp_aws_secret_key',
          'amazon_sp_role_arn': 'amazon_sp_role_arn',
          'amazon_ads_client_id': 'amazon_ads_client_id',
          'amazon_ads_client_secret': 'amazon_ads_client_secret',
          'amazon_ads_refresh_token': 'amazon_ads_refresh_token',
          'amazon_ads_profile_id': 'amazon_ads_profile_id',
          'amazon_ads_profile_id_us': 'amazon_ads_profile_id',
          'google_sheet_api': 'google_sheet_api',
          'google_drive_api': 'google_drive_api',
          'google_sheet_link': 'google_sheet_link',
          'google_drive_link': 'google_drive_link',
          'slack_api': 'slack_api',
          'telegram_api': 'telegram_api',
          'whatsapp_api': 'whatsapp_api',
          'walmart_api': 'walmart_api',
          'tiktok_store_api': 'tiktok_store_api',
          'tiktok_posting_api': 'tiktok_posting_api',
          'gmail_api': 'gmail_api',
          'slack_channel_id': 'slack_channel_id',
          'notification_preference': 'notification_preference',
        }

        if (mapping[cleanKey]) {
          newConfig[mapping[cleanKey]] = value
          importedCount++
        }
      }
    })

    if (importedCount > 0) {
      setConfig(newConfig)
      setLastAction(`Imported ${importedCount} fields successfully ✅`)
      setBulkText('')
    } else {
      setLastAction('No valid fields found in import text ❌')
    }
  }

  const downloadTemplate = () => {
    const template = `✅AMAZON_SP_CLIENT_ID: ${config.amazon_sp_client_id || 'enter_value'}
✅AMAZON_SP_CLIENT_SECRET: ${config.amazon_sp_client_secret || 'enter_value'}
✅AMAZON_SP_REFRESH_TOKEN: ${config.amazon_sp_refresh_token || 'enter_value'}
✅AMAZON_SP_AWS_ACCESS_KEY: ${config.amazon_sp_aws_access_key || 'enter_value'}
✅AMAZON_SP_AWS_SECRET_KEY: ${config.amazon_sp_aws_secret_key || 'enter_value'}
✅AMAZON_SP_ROLE_ARN: ${config.amazon_sp_role_arn || 'enter_value'}
✅AMAZON_ADS_CLIENT_ID: ${config.amazon_ads_client_id || 'enter_value'}
✅AMAZON_ADS_CLIENT_SECRET: ${config.amazon_ads_client_secret || 'enter_value'}
✅AMAZON_ADS_REFRESH_TOKEN: ${config.amazon_ads_refresh_token || 'enter_value'}
✅AMAZON_ADS_PROFILE_ID: ${config.amazon_ads_profile_id || 'enter_value'}
✅GOOGLE_SHEET_API: ${config.google_sheet_api || 'enter_value'}
✅GOOGLE_DRIVE_API: ${config.google_drive_api || 'enter_value'}
✅GOOGLE_SHEET_LINK: ${config.google_sheet_link || 'enter_value'}
✅GOOGLE_DRIVE_LINK: ${config.google_drive_link || 'enter_value'}
✅SLACK_API: ${config.slack_api || 'enter_value'}
✅TELEGRAM_API: ${config.telegram_api || 'enter_value'}
✅WHATSAPP_API: ${config.whatsapp_api || 'enter_value'}
✅WALMART_API: ${config.walmart_api || 'enter_value'}
✅TIKTOK_STORE_API: ${config.tiktok_store_api || 'enter_value'}
✅TIKTOK_POSTING_API: ${config.tiktok_posting_api || 'enter_value'}
✅GMAIL_API: ${config.gmail_api || 'enter_value'}
✅SLACK_CHANNEL_ID: ${config.slack_channel_id || 'enter_value'}
✅NOTIFICATION_PREFERENCE: ${config.notification_preference || 'telegram'}`

    const blob = new Blob([template], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'config_template.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    setLastAction('Saving configuration...')
    try {
      // Endpoint to save config
      const res = await fetch('https://dashboard-pro-2464.onrender.com/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (res.ok) setLastAction('Configuration saved ✅')
    } catch (err) {
      setLastAction('Error saving configuration ❌')
    }
  }

  const triggerTask = async (taskName) => {
    setLastAction(`Requesting: ${taskName}...`)
    setTaskProgress(0)
    setTaskMessage('Starting...')
    setTaskResult('')

    try {
      const res = await fetch(`https://dashboard-pro-2464.onrender.com/api/run-task/${taskName}`, { method: 'POST' })
      const data = await res.json()

      if (data.task_id) {
        setLastAction(`Task ${taskName} is running...`)
        setCurrentTask(data.task_id)

        // Start Polling
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`https://dashboard-pro-2464.onrender.com/api/task-status/${data.task_id}`)
            const statusData = await statusRes.json()

            if (statusData.status === 'completed') {
              clearInterval(pollInterval)
              setCurrentTask(null)
              setTaskProgress(100)
              setTaskMessage(statusData.message)
              setLastAction(`${taskName} Success! ✅`)
              setTaskResult(statusData.message)
            } else if (statusData.status === 'failed') {
              clearInterval(pollInterval)
              setCurrentTask(null)
              setTaskMessage(`Error: ${statusData.message}`)
              setLastAction(`Task failed ❌`)
            } else {
              setTaskProgress(statusData.progress || 10)
              setTaskMessage(statusData.message)
            }
          } catch (e) {
            console.error('Polling error:', e)
          }
        }, 2000)
      } else {
        setLastAction(`Task failed to start ❌`)
      }
    } catch (err) {
      setLastAction(`Connection error ❌`)
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>✅ PRO_API</h1>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
          <div className="status-badge">
            <span className="status-indicator"></span>
            {status}
          </div>
          <div className="status-badge" style={{ backgroundColor: 'transparent', borderColor: 'var(--border-color)' }}>
            {lastAction}
          </div>
        </div>
      </header>

      <div className="status-badges-container" style={{ padding: '0 5%' }}>
        {currentTask && (
          <div className="card task-status-card" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary-color)' }}>
            <h3>⚡ Running Task: {currentTask.split('_')[0]}</h3>
            <div className="progress-container" style={{ height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden', margin: '1rem 0' }}>
              <div className="progress-bar" style={{ width: `${taskProgress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.4s ease' }}></div>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{taskMessage}</p>
          </div>
        )}

        {taskResult && (
          <div className="card task-result-card" style={{ marginBottom: '1.5rem', border: '1px solid #1a1a1a', background: '#0a0a0a' }}>
            <h3>🏁 Task Results</h3>
            <p style={{ margin: '1rem 0', color: '#ffffff' }}>{taskResult}</p>
          </div>
        )}
      </div>

      <div className="permission-banner">
        <label className="checkbox-wrapper">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={permissionGranted}
            onChange={(e) => setPermissionGranted(e.target.checked)}
          />
          <div className="custom-checkbox"></div>
          <span>I HAVE ADDED THIS USER WITH EDIT PERMISSIONS ON THAT GOOGLE SHEET & GOOGLE DRIVE FOLDER: <br /><span className="email-highlight">test-1@astute-binder-488623-a4.iam.gserviceaccount.com</span></span>
        </label>
      </div>

      <main className="section-wrapper">
        <section className="card">
          <h2>API Configuration</h2>
          <form onSubmit={handleSaveConfig}>
            <div className="grid grid-2">
              {/* === AMAZON SP API SECTION === */}
              <div className="section-divider" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>✅ Amazon SP API Credentials</h3>
              </div>
              <div className="form-group">
                <label>✅ AMAZON SP CLIENT ID</label>
                <input type="text" className="input-field" name="amazon_sp_client_id" value={config.amazon_sp_client_id} onChange={handleInputChange} placeholder="Client ID" />
              </div>
              <div className="form-group">
                <label>✅ AMAZON SP CLIENT SECRET</label>
                <input type="password" className="input-field" name="amazon_sp_client_secret" value={config.amazon_sp_client_secret} onChange={handleInputChange} placeholder="Client Secret" />
              </div>
              <div className="form-group">
                <label>✅ AMAZON SP REFRESH TOKEN</label>
                <input type="text" className="input-field" name="amazon_sp_refresh_token" value={config.amazon_sp_refresh_token} onChange={handleInputChange} placeholder="Refresh Token" />
              </div>
              <div className="form-group">
                <label>✅ AMAZON SP AWS ACCESS KEY</label>
                <input type="password" className="input-field" name="amazon_sp_aws_access_key" value={config.amazon_sp_aws_access_key} onChange={handleInputChange} placeholder="AWS IAM Access Key" />
              </div>
              <div className="form-group">
                <label>✅ AMAZON SP AWS SECRET KEY</label>
                <input type="password" className="input-field" name="amazon_sp_aws_secret_key" value={config.amazon_sp_aws_secret_key} onChange={handleInputChange} placeholder="AWS IAM Secret Key" />
              </div>
              <div className="form-group">
                <label>✅ AMAZON SP ROLE ARN</label>
                <input type="text" className="input-field" name="amazon_sp_role_arn" value={config.amazon_sp_role_arn} onChange={handleInputChange} placeholder="arn:aws:iam::..." />
              </div>

              {/* === AMAZON ADS API SECTION === */}
              <div className="section-divider" style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>✅ Amazon Ads API Credentials</h3>
              </div>
              <div className="form-group">
                <label>✅ AMAZON ADS CLIENT ID</label>
                <input type="text" className="input-field" name="amazon_ads_client_id" value={config.amazon_ads_client_id} onChange={handleInputChange} placeholder="Client ID" />
              </div>
              <div className="form-group">
                <label>✅ AMAZON ADS CLIENT SECRET</label>
                <input type="password" className="input-field" name="amazon_ads_client_secret" value={config.amazon_ads_client_secret} onChange={handleInputChange} placeholder="Client Secret" />
              </div>
              <div className="form-group">
                <label>✅ AMAZON ADS REFRESH TOKEN</label>
                <input type="text" className="input-field" name="amazon_ads_refresh_token" value={config.amazon_ads_refresh_token} onChange={handleInputChange} placeholder="Refresh Token" />
              </div>
              <div className="form-group">
                <label>✅ AMAZON ADS PROFILE ID</label>
                <input type="text" className="input-field" name="amazon_ads_profile_id" value={config.amazon_ads_profile_id} onChange={handleInputChange} placeholder="Profile ID" />
              </div>

              {/* === OTHER APIS SECTION === */}
              <div className="section-divider" style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>✅ Other API Settings</h3>
              </div>
              <div className="form-group">
                <label>✅ GOOGLE SHEET API</label>
                <input type="text" className="input-field" name="google_sheet_api" value={config.google_sheet_api} onChange={handleInputChange} placeholder="Enter Sheet API" />
              </div>
              <div className="form-group">
                <label>✅ GOOGLE DRIVE API</label>
                <input type="text" className="input-field" name="google_drive_api" value={config.google_drive_api} onChange={handleInputChange} placeholder="Enter Drive API" />
              </div>
              <div className="form-group">
                <label>✅ GOOGLE SHEET LINK</label>
                <input type="text" className="input-field" name="google_sheet_link" value={config.google_sheet_link} onChange={handleInputChange} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>✅ GOOGLE DRIVE LINK</label>
                <input type="text" className="input-field" name="google_drive_link" value={config.google_drive_link} onChange={handleInputChange} placeholder="https://..." />
              </div>

              <div className="form-group">
                <label>✅ GMAIL API</label>
                <input type="text" className="input-field" name="gmail_api" value={config.gmail_api} onChange={handleInputChange} placeholder="Enter Gmail API" />
              </div>
              <div className="form-group">
                <label>✅ SLACK API</label>
                <input type="text" className="input-field" name="slack_api" value={config.slack_api} onChange={handleInputChange} placeholder="Enter Slack API" />
              </div>
              <div className="form-group">
                <label>✅ TELEGRAM API</label>
                <input type="text" className="input-field" name="telegram_api" value={config.telegram_api} onChange={handleInputChange} placeholder="Enter Telegram API" />
              </div>
              <div className="form-group">
                <label>✅ WHATSAPP API</label>
                <input type="text" className="input-field" name="whatsapp_api" value={config.whatsapp_api} onChange={handleInputChange} placeholder="Enter WhatsApp API" />
              </div>
              <div className="form-group">
                <label>✅ WALMART API</label>
                <input type="text" className="input-field" name="walmart_api" value={config.walmart_api} onChange={handleInputChange} placeholder="Enter Walmart API" />
              </div>
              <div className="form-group">
                <label>✅ TIKTOK STORE API</label>
                <input type="text" className="input-field" name="tiktok_store_api" value={config.tiktok_store_api} onChange={handleInputChange} placeholder="Enter TikTok Store API" />
              </div>
              <div className="form-group">
                <label>✅ TIKTOK POSTING API</label>
                <input type="text" className="input-field" name="tiktok_posting_api" value={config.tiktok_posting_api} onChange={handleInputChange} placeholder="Enter TikTok Posting API" />
              </div>
              <div className="form-group">
                <label>✅ Slack Channel ID (for Report)</label>
                <input type="text" className="input-field" name="slack_channel_id" value={config.slack_channel_id} onChange={handleInputChange} placeholder="Enter Slack Channel ID" />
              </div>

              <div className="form-group">
                <label>✅ Notification Preference</label>
                <select className="input-field" name="notification_preference" value={config.notification_preference} onChange={handleInputChange}>
                  <option value="telegram">Telegram Bot</option>
                  <option value="email">Gmail API (App Password)</option>
                </select>
              </div>
            </div>
            <div className="save-btn-container" style={{ gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={downloadTemplate}>Download Template</button>
              <button type="submit" className="btn btn-primary">Save Configuration</button>
            </div>
          </form>
        </section>

        <section className="card">
          <h2>Bulk API Import</h2>
          <p>Paste your <code>KEY: VALUE</code> block here to fill all fields instantly.</p>
          <div className="form-group">
            <textarea
              className="input-field"
              style={{ minHeight: '200px', fontFamily: 'monospace', resize: 'vertical' }}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"AMAZON_SP_CLIENT_ID: your_id\nAMAZON_SP_CLIENT_SECRET: your_secret\n..."}
            />
          </div>
          <div className="save-btn-container" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={handleBulkImport}>Import All Keys</button>
          </div>
        </section>

        <section className="card">
          <h2>System Actions</h2>
          <div className="action-grid">
            <button className="action-btn" onClick={() => triggerTask('ACCOUNTING')}>
              <div className="action-icon">📊</div>
              <div className="action-info">
                <h3>ACCOUNTING</h3>
                <p>Sync Amazon Data & Create Sheet</p>
              </div>
            </button>
            <button className="action-btn" onClick={() => triggerTask('SLACK_REPORT')}>
              <div className="action-icon">💬</div>
              <div className="action-info">
                <h3>SLACK_REPORT</h3>
                <p>Send Spreadsheet Screenshot</p>
              </div>
            </button>
            <button className="action-btn" onClick={() => triggerTask('AUTOMATION')}>
              <div className="action-icon">🤖</div>
              <div className="action-info">
                <h3>AUTOMATION</h3>
                <p>Run ACCOUNTING + SLACK hourly</p>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
