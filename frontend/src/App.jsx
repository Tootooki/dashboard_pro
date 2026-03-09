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
  })

  const [bulkText, setBulkText] = useState('')
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [status, setStatus] = useState('Online')
  const [lastAction, setLastAction] = useState('Ready')

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
        const key = parts[0].trim().toLowerCase()
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
          'gmail_api': 'gmail_api'
        }

        if (mapping[key]) {
          newConfig[mapping[key]] = value
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
    const template = `AMAZON_SP_CLIENT_ID: ${config.amazon_sp_client_id || 'enter_value'}
AMAZON_SP_CLIENT_SECRET: ${config.amazon_sp_client_secret || 'enter_value'}
AMAZON_SP_REFRESH_TOKEN: ${config.amazon_sp_refresh_token || 'enter_value'}
AMAZON_SP_AWS_ACCESS_KEY: ${config.amazon_sp_aws_access_key || 'enter_value'}
AMAZON_SP_AWS_SECRET_KEY: ${config.amazon_sp_aws_secret_key || 'enter_value'}
AMAZON_SP_ROLE_ARN: ${config.amazon_sp_role_arn || 'enter_value'}
AMAZON_ADS_CLIENT_ID: ${config.amazon_ads_client_id || 'enter_value'}
AMAZON_ADS_CLIENT_SECRET: ${config.amazon_ads_client_secret || 'enter_value'}
AMAZON_ADS_REFRESH_TOKEN: ${config.amazon_ads_refresh_token || 'enter_value'}
AMAZON_ADS_PROFILE_ID: ${config.amazon_ads_profile_id || 'enter_value'}
GOOGLE_SHEET_API: ${config.google_sheet_api || 'enter_value'}
GOOGLE_DRIVE_API: ${config.google_drive_api || 'enter_value'}
GOOGLE_SHEET_LINK: ${config.google_sheet_link || 'enter_value'}
GOOGLE_DRIVE_LINK: ${config.google_drive_link || 'enter_value'}
SLACK_API: ${config.slack_api || 'enter_value'}
TELEGRAM_API: ${config.telegram_api || 'enter_value'}
WHATSAPP_API: ${config.whatsapp_api || 'enter_value'}
WALMART_API: ${config.walmart_api || 'enter_value'}
TIKTOK_STORE_API: ${config.tiktok_store_api || 'enter_value'}
TIKTOK_POSTING_API: ${config.tiktok_posting_api || 'enter_value'}
GMAIL_API: ${config.gmail_api || 'enter_value'}`

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
    setLastAction(`Running: ${taskName}...`)
    try {
      const res = await fetch(`https://dashboard-pro-2464.onrender.com/api/run-task/${taskName}`, { method: 'POST' })
      if (res.ok) setLastAction(`Task completed: ${taskName} ✅`)
    } catch (err) {
      setLastAction(`Task failed: ${taskName} ❌`)
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>PRO_API</h1>
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
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Amazon SP API Credentials</h3>
              </div>
              <div className="form-group">
                <label>SP API CLIENT ID</label>
                <input type="text" className="input-field" name="amazon_sp_client_id" value={config.amazon_sp_client_id} onChange={handleInputChange} placeholder="Client ID" />
              </div>
              <div className="form-group">
                <label>SP API CLIENT SECRET</label>
                <input type="password" className="input-field" name="amazon_sp_client_secret" value={config.amazon_sp_client_secret} onChange={handleInputChange} placeholder="Client Secret" />
              </div>
              <div className="form-group">
                <label>SP API REFRESH TOKEN</label>
                <input type="text" className="input-field" name="amazon_sp_refresh_token" value={config.amazon_sp_refresh_token} onChange={handleInputChange} placeholder="Refresh Token" />
              </div>
              <div className="form-group">
                <label>AWS ACCESS KEY</label>
                <input type="password" className="input-field" name="amazon_sp_aws_access_key" value={config.amazon_sp_aws_access_key} onChange={handleInputChange} placeholder="AWS IAM Access Key" />
              </div>
              <div className="form-group">
                <label>AWS SECRET KEY</label>
                <input type="password" className="input-field" name="amazon_sp_aws_secret_key" value={config.amazon_sp_aws_secret_key} onChange={handleInputChange} placeholder="AWS IAM Secret Key" />
              </div>
              <div className="form-group">
                <label>AWS ROLE ARN</label>
                <input type="text" className="input-field" name="amazon_sp_role_arn" value={config.amazon_sp_role_arn} onChange={handleInputChange} placeholder="arn:aws:iam::..." />
              </div>

              {/* === AMAZON ADS API SECTION === */}
              <div className="section-divider" style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Amazon Ads API Credentials</h3>
              </div>
              <div className="form-group">
                <label>ADS API CLIENT ID</label>
                <input type="text" className="input-field" name="amazon_ads_client_id" value={config.amazon_ads_client_id} onChange={handleInputChange} placeholder="Client ID" />
              </div>
              <div className="form-group">
                <label>ADS API CLIENT SECRET</label>
                <input type="password" className="input-field" name="amazon_ads_client_secret" value={config.amazon_ads_client_secret} onChange={handleInputChange} placeholder="Client Secret" />
              </div>
              <div className="form-group">
                <label>ADS API REFRESH TOKEN</label>
                <input type="text" className="input-field" name="amazon_ads_refresh_token" value={config.amazon_ads_refresh_token} onChange={handleInputChange} placeholder="Refresh Token" />
              </div>
              <div className="form-group">
                <label>ADS PROFILE ID (US Market)</label>
                <input type="text" className="input-field" name="amazon_ads_profile_id" value={config.amazon_ads_profile_id} onChange={handleInputChange} placeholder="Profile ID" />
              </div>

              {/* === OTHER APIS SECTION === */}
              <div className="section-divider" style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Other API Settings</h3>
              </div>
              <div className="form-group">
                <label>GOOGLE SHEET API</label>
                <input type="text" className="input-field" name="google_sheet_api" value={config.google_sheet_api} onChange={handleInputChange} placeholder="Enter Sheet API" />
              </div>
              <div className="form-group">
                <label>GOOGLE DRIVE API</label>
                <input type="text" className="input-field" name="google_drive_api" value={config.google_drive_api} onChange={handleInputChange} placeholder="Enter Drive API" />
              </div>
              <div className="form-group">
                <label>GOOGLE SHEET LINK</label>
                <input type="text" className="input-field" name="google_sheet_link" value={config.google_sheet_link} onChange={handleInputChange} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>GOOGLE DRIVE LINK</label>
                <input type="text" className="input-field" name="google_drive_link" value={config.google_drive_link} onChange={handleInputChange} placeholder="https://..." />
              </div>

              <div className="form-group">
                <label>GMAIL API</label>
                <input type="text" className="input-field" name="gmail_api" value={config.gmail_api} onChange={handleInputChange} placeholder="Enter Gmail API" />
              </div>
              <div className="form-group">
                <label>SLACK API</label>
                <input type="text" className="input-field" name="slack_api" value={config.slack_api} onChange={handleInputChange} placeholder="Enter Slack API" />
              </div>
              <div className="form-group">
                <label>TELEGRAM API</label>
                <input type="text" className="input-field" name="telegram_api" value={config.telegram_api} onChange={handleInputChange} placeholder="Enter Telegram API" />
              </div>
              <div className="form-group">
                <label>WHATSAPP API</label>
                <input type="text" className="input-field" name="whatsapp_api" value={config.whatsapp_api} onChange={handleInputChange} placeholder="Enter WhatsApp API" />
              </div>
              <div className="form-group">
                <label>WALMART API</label>
                <input type="text" className="input-field" name="walmart_api" value={config.walmart_api} onChange={handleInputChange} placeholder="Enter Walmart API" />
              </div>
              <div className="form-group">
                <label>TIKTOK STORE API</label>
                <input type="text" className="input-field" name="tiktok_store_api" value={config.tiktok_store_api} onChange={handleInputChange} placeholder="Enter TikTok Store API" />
              </div>
              <div className="form-group">
                <label>TIKTOK POSTING API</label>
                <input type="text" className="input-field" name="tiktok_posting_api" value={config.tiktok_posting_api} onChange={handleInputChange} placeholder="Enter TikTok Posting API" />
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
            <button className="action-btn" onClick={() => triggerTask('download_accounting_sheet')}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download ACCOUNTING Sheet
            </button>
            <button className="action-btn" onClick={() => triggerTask('sync_amazon_data')}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Sync Amazon Data
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
