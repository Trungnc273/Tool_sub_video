import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Video, Sliders, Volume2 } from 'lucide-react'
import { Dashboard, Project } from './components/Dashboard'
import { Workspace } from './components/Workspace'
import { Settings, AppSettings, DEFAULT_SETTINGS } from './components/Settings'

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workspace' | 'settings'>('dashboard')
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [bgVolume, setBgVolume] = useState(30)
  const [ttsVolume, setTtsVolume] = useState(100)
  const [showVolumePopover, setShowVolumePopover] = useState(false)

  // Load projects and settings on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('vietsub_projects')
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects))
      } catch (e) {
        console.error(e)
      }
    }

    const loadSettings = async (): Promise<void> => {
      let merged = { ...DEFAULT_SETTINGS }
      const savedSettings = localStorage.getItem('vietsub_settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          merged = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            subtitleStyle: {
              ...DEFAULT_SETTINGS.subtitleStyle,
              ...(parsed.subtitleStyle || {})
            }
          }
          // Dọn key plaintext còn sót từ phiên bản cũ (trước khi có safeStorage)
          if (parsed.apiKey || parsed.elevenLabsApiKey) {
            const rest = { ...parsed }
            delete rest.apiKey
            delete rest.elevenLabsApiKey
            localStorage.setItem('vietsub_settings', JSON.stringify(rest))
          }
        } catch (e) {
          console.error(e)
        }
      }
      try {
        // API keys được lưu mã hóa riêng qua main process, không nằm trong localStorage
        const [apiKey, elevenLabsApiKey] = await Promise.all([
          window.api.loadSecureSetting('apiKey'),
          window.api.loadSecureSetting('elevenLabsApiKey')
        ])
        if (apiKey) merged.apiKey = apiKey
        if (elevenLabsApiKey) merged.elevenLabsApiKey = elevenLabsApiKey
      } catch (e) {
        console.error('Không đọc được key bảo mật:', e)
      }
      setSettings(merged)
    }
    loadSettings()
  }, [])

  // Save projects to localStorage
  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects)
    localStorage.setItem('vietsub_projects', JSON.stringify(updatedProjects))
  }

  // Handle saving current settings
  // API keys đi qua kênh mã hóa của main process; phần còn lại vào localStorage như cũ
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    const { apiKey, elevenLabsApiKey, ...rest } = newSettings
    localStorage.setItem('vietsub_settings', JSON.stringify(rest))
    Promise.all([
      window.api.saveSecureSetting('apiKey', apiKey || ''),
      window.api.saveSecureSetting('elevenLabsApiKey', elevenLabsApiKey || '')
    ]).catch((e) => {
      console.error('Không lưu được key bảo mật:', e)
      alert('Không lưu được API key một cách an toàn. Vui lòng thử lại.')
    })
  }

  // Handle select project
  const handleSelectProject = (project: Project) => {
    setActiveProject(project)
    setActiveTab('workspace')
    setShowVolumePopover(false)
  }

  // Handle create project
  const handleCreateProject = (newProject: Project) => {
    const updated = [newProject, ...projects]
    saveProjects(updated)
    setActiveProject(newProject)
    setActiveTab('workspace')
    setShowVolumePopover(false)
  }

  // Handle delete project
  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id)
    saveProjects(updated)
    if (activeProject?.id === id) {
      setActiveProject(null)
      setActiveTab('dashboard')
    }
  }

  // Handle save project changes
  const handleSaveProject = (updatedProject: Project) => {
    const updated = projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    saveProjects(updated)
    setActiveProject(updatedProject)
  }

  const isCollapsed = activeTab === 'workspace'

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="brand-section">
          <div className="brand-logo">VS</div>
          {!isCollapsed && <h1 className="brand-title">VietSub Pro</h1>}
        </div>

        <nav className="nav-menu">
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dashboard')
              setShowVolumePopover(false)
            }}
            title={isCollapsed ? 'Bảng điều khiển' : undefined}
          >
            <LayoutDashboard className="nav-icon" />
            {!isCollapsed && 'Bảng điều khiển'}
          </div>
          <div
            className={`nav-item ${activeTab === 'workspace' ? 'active' : ''} ${!activeProject ? 'nav-disabled' : ''}`}
            style={{
              opacity: activeProject ? 1 : 0.4,
              cursor: activeProject ? 'pointer' : 'not-allowed',
              pointerEvents: activeProject ? 'auto' : 'none'
            }}
            onClick={() => activeProject && setActiveTab('workspace')}
            title={isCollapsed ? 'Phòng biên tập' : undefined}
          >
            <Video className="nav-icon" />
            {!isCollapsed && 'Phòng biên tập'}
          </div>
          <div
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings')
              setShowVolumePopover(false)
            }}
            title={isCollapsed ? 'Cài đặt' : undefined}
          >
            <Sliders className="nav-icon" />
            {!isCollapsed && 'Cài đặt'}
          </div>
          {activeTab === 'workspace' && (
            <div
              className={`nav-item ${showVolumePopover ? 'active' : ''}`}
              onClick={() => setShowVolumePopover(!showVolumePopover)}
              title={isCollapsed ? 'Âm lượng' : undefined}
              style={{ position: 'relative' }}
            >
              <Volume2 className="nav-icon" />
              {!isCollapsed && 'Âm lượng'}

              {/* Volume Popover */}
              {showVolumePopover && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    left: '60px',
                    bottom: '0',
                    width: '260px',
                    padding: '16px',
                    background: '#13141f',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    cursor: 'default'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#fff' }}>
                      <span style={{ fontWeight: 600 }}>Âm lượng video gốc</span>
                      <span style={{ fontFamily: 'monospace' }}>{bgVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bgVolume}
                      onChange={(e) => setBgVolume(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-purple)', height: '4px', cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#fff' }}>
                      <span style={{ fontWeight: 600 }}>Âm lượng phụ đề (TTS)</span>
                      <span style={{ fontFamily: 'monospace' }}>{ttsVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ttsVolume}
                      onChange={(e) => setTtsVolume(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-purple)', height: '4px', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {!isCollapsed && (
          <div className="sidebar-footer">
            <div>Phiên bản 1.0.0</div>
            <div>AI Subtitle Studio</div>
          </div>
        )}
      </div>

      {/* Main Viewport */}
      <div className="main-content">
        {activeTab !== 'workspace' && (
          <div className="top-bar">
            <h2 className="page-title">
              {activeTab === 'dashboard' && 'Quản lý dự án'}
              {activeTab === 'settings' && 'Thiết lập hệ thống'}
            </h2>
          </div>
        )}

        <div className="content-body" style={{ padding: activeTab === 'workspace' ? 0 : '24px' }}>
          {activeTab === 'dashboard' && (
            <Dashboard
              projects={projects}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {activeTab === 'workspace' && activeProject && (
            <Workspace
              project={activeProject}
              settings={settings}
              onSaveProject={handleSaveProject}
              onBack={() => setActiveTab('dashboard')}
              onChangeSettings={handleSaveSettings}
              bgVolume={bgVolume}
              setBgVolume={setBgVolume}
              ttsVolume={ttsVolume}
              setTtsVolume={setTtsVolume}
            />
          )}

          {activeTab === 'settings' && (
            <Settings settings={settings} onSaveSettings={handleSaveSettings} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
export {}
