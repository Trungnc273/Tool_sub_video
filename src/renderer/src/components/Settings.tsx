import React, { useState, useEffect } from 'react'
import { Save, Settings as SettingsIcon, Sliders, Palette, Eye, Plus, Minus } from 'lucide-react'

const WhisperStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<{ ready: boolean; pythonVersion?: string; hasFasterWhisper?: boolean; modelPath?: string } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await window.api.invoke('check-local-whisper')
        setStatus(result)
      } catch (err) {
        setStatus({ ready: false })
      } finally {
        setChecking(false)
      }
    }
    checkStatus()
  }, [])

  if (checking) {
    return (
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>🔄</span> Đang kiểm tra...
      </div>
    )
  }

  if (!status || !status.ready) {
    return (
      <div style={{ fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>❌</span> Chưa cài đặt Python hoặc faster-whisper
      </div>
    )
  }

  return (
    <div style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>✅</span> Sẵn sàng - Python {status.pythonVersion}
      </div>
      {status.hasFasterWhisper && (
        <div style={{ color: 'var(--text-muted)', marginLeft: '22px' }}>
          📦 faster-whisper đã cài đặt
        </div>
      )}
      {status.modelPath && (
        <div style={{ color: 'var(--text-muted)', marginLeft: '22px', fontSize: '0.8rem' }}>
          🎯 Mô hình Whisper đã tải
        </div>
      )}
    </div>
  )
}

export interface AppSettings {
  apiKey: string
  baseUrl: string
  elevenLabsApiKey?: string
  model: string
  systemPrompt: string
  characterContext?: string
  nameDictionary?: string
  whisperSource?: 'openai' | 'local'
  subtitleStyle: {
    fontSize: number
    color: string
    bgColor: string
    outlineColor: string
    outlineWidth: number
    posY: number
    posX: number
    showBgStrip?: boolean
    bgStripHeight?: number
    bgStripPosY?: number
    bgStripWidth?: number
    bgStripPosX?: number
    bgStripColor?: string
    bgStripOpacity?: number
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  baseUrl: 'https://api.ai-box.vn/v1',
  elevenLabsApiKey: '',
  model: 'deepseek-v4-flash',
  systemPrompt:
    'Dịch phụ đề từ ngôn ngữ nguồn sang tiếng Việt. Yêu cầu dịch mượt mà, văn phong tự nhiên, phù hợp với ngữ cảnh phim/video. Giữ nguyên định dạng và ý nghĩa của các đại từ xưng hô phù hợp cho các nhân vật dựa vào ngữ cảnh nếu có.',
  characterContext: 'Xưng hô kiếm hiệp cổ trang (Ta - Ngươi) hoặc đối thoại hiện đại tự nhiên (Anh - Em, Tôi - Bạn) tùy thuộc vào thể loại video.',
  nameDictionary: '',
  whisperSource: 'local',
    subtitleStyle: {
      fontSize: 24,
      color: '#ffffff',
      bgColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 2,
      posY: 12,
      posX: 50,
      showBgStrip: false,
      bgStripHeight: 8,
      bgStripPosY: 12,
      bgStripWidth: 100,
      bgStripPosX: 50,
      bgStripColor: '#15151d',
      bgStripOpacity: 60
    }
  }

interface SettingsProps {
  settings: AppSettings
  onSaveSettings: (settings: AppSettings) => void
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSaveSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleChange = (path: string, value: any) => {
    setLocalSettings((prev) => {
      const copy = { ...prev }
      if (path.includes('.')) {
        const [parent, child] = path.split('.')
        copy[parent] = { ...copy[parent], [child]: value }
      } else {
        copy[path] = value
      }
      return copy
    })
  }

  const handleSave = () => {
    onSaveSettings(localSettings)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cài Đặt Hệ Thống</h2>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={18} />
          Lưu cài đặt
        </button>
      </div>

      {isSaved && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--text-success)',
            color: 'var(--text-success)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          Cấu hình đã được lưu thành công!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* API Settings */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <SettingsIcon size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cấu hình API Dịch thuật (AI)</h3>
          </div>

          {!localSettings.apiKey && (
            <div className="form-group">
              <label className="form-label">API Key (Tùy chọn)</label>
              <input
                type="password"
                className="form-input"
                placeholder="sk-..."
                value={localSettings.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Để trống nếu đã cấu hình trong file .env. API Key sẽ được lưu trữ an toàn trên thiết bị.
              </span>
            </div>
          )}

          {localSettings.apiKey && (
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#10b981' }}>
                <span>✅</span> API Key đã được cấu hình
              </div>
              <button 
                onClick={() => handleChange('apiKey', '')}
                style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Xóa và nhập lại
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">API Base URL</label>
              <input
                type="text"
                className="form-input"
                value={localSettings.baseUrl}
                onChange={(e) => handleChange('baseUrl', e.target.value)}
                placeholder="https://api.ai-box.vn/v1"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                DeepSeek, OpenAI, hoặc API tương thích
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">Mô hình AI</label>
              <select
                className="form-select"
                value={localSettings.model}
                onChange={(e) => handleChange('model', e.target.value)}
              >
                <option value="deepseek-v4-flash">deepseek-v4-flash (Khuyên dùng - Nhanh & Rẻ)</option>
                <option value="gpt-4o-mini">gpt-4o-mini (OpenAI)</option>
                <option value="gpt-4o">gpt-4o (OpenAI - Độ chính xác cao)</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo (OpenAI - Cũ)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ElevenLabs API Settings */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <SettingsIcon size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cấu hình ElevenLabs API</h3>
          </div>

          <div className="form-group">
            <label className="form-label">ElevenLabs API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="sk_..."
              value={localSettings.elevenLabsApiKey || ''}
              onChange={(e) => handleChange('elevenLabsApiKey', e.target.value)}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              API Key dùng để lấy giọng nói nhân tạo chất lượng cao từ ElevenLabs.
            </span>
          </div>
        </div>

        {/* Whisper STT Settings */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <SettingsIcon size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cấu hình Whisper STT (Nhận diện giọng nói)</h3>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '12px' }}>Nguồn Whisper</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', cursor: 'pointer', border: localSettings.whisperSource === 'local' ? '2px solid var(--accent-purple)' : '2px solid transparent' }}>
                <input
                  type="radio"
                  name="whisperSource"
                  value="local"
                  checked={localSettings.whisperSource === 'local' || !localSettings.whisperSource}
                  onChange={(e) => handleChange('whisperSource', e.target.value)}
                  style={{ marginTop: '2px', accentColor: 'var(--accent-purple)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>🚀 Local Whisper (Khuyên dùng - Miễn phí, Không giới hạn)</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Sử dụng faster-whisper chạy trên máy tính của bạn. Không cần API key, không giới hạn, hoàn toàn miễn phí.
                  </div>
                  <WhisperStatusIndicator />
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', cursor: 'pointer', border: localSettings.whisperSource === 'openai' ? '2px solid var(--accent-purple)' : '2px solid transparent' }}>
                <input
                  type="radio"
                  name="whisperSource"
                  value="openai"
                  checked={localSettings.whisperSource === 'openai'}
                  onChange={(e) => handleChange('whisperSource', e.target.value)}
                  style={{ marginTop: '2px', accentColor: 'var(--accent-purple)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>☁️ OpenAI Whisper API (Trả phí)</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Sử dụng API của OpenAI. Yêu cầu API key và tính phí theo số phút audio. File tối đa 25MB.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {(localSettings.whisperSource === 'local' || !localSettings.whisperSource) && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px' }}>💡 Hướng dẫn cài đặt Local Whisper:</div>
              <ol style={{ margin: '8px 0 0 20px', lineHeight: '1.6' }}>
                <li>Tải Python 3.11+ từ <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-purple)' }}>python.org</a></li>
                <li>Mở Command Prompt (cmd) và chạy: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>pip install faster-whisper</code></li>
                <li>Khởi động lại ứng dụng Sub 4.0</li>
              </ol>
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Xem thêm tại <a href="https://github.com/SYSTRAN/faster-whisper" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-purple)' }}>github.com/SYSTRAN/faster-whisper</a>
              </div>
            </div>
          )}
        </div>

        {/* Translation Settings */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Sliders size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cấu hình dịch thuật AI</h3>
          </div>

          <div className="form-group">
            <label className="form-label">System Prompt (Câu lệnh gợi ý dịch thuật)</label>
            <textarea
              className="form-input"
              rows={3}
              style={{ resize: 'vertical' }}
              value={localSettings.systemPrompt}
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Bối cảnh & Xưng hô nhân vật (Context & Pronouns)</label>
            <textarea
              className="form-input"
              rows={3}
              style={{ resize: 'vertical' }}
              value={localSettings.characterContext || ''}
              onChange={(e) => handleChange('characterContext', e.target.value)}
              placeholder="Ví dụ: Tôn Ngộ Không xưng là Ta/Lão Tôn và gọi đối phương là Ngươi. Mỹ Đệ Toa xưng là Ta và gọi đối phương là Ngươi/Con khỉ kia. Cách xưng hô mang phong cách kiếm hiệp cổ trang."
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Cung cấp bối cảnh hoặc danh sách nhân vật và cách xưng hô cụ thể để AI dịch nhất quán trong suốt video.
            </span>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Tên riêng & Luật dịch bắt buộc (Name Dictionary)</label>
            <textarea
              className="form-input"
              rows={3}
              style={{ resize: 'vertical' }}
              value={localSettings.nameDictionary || ''}
              onChange={(e) => handleChange('nameDictionary', e.target.value)}
              placeholder="Ví dụ:&#10;浮华: Phù Hoa&#10;李小龙: Lý Tiểu Long&#10;吃瓜: hóng biến"
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Mỗi quy ước trên một dòng dạng `từ_gốc: từ_dịch`. Các quy ước này sẽ được AI áp dụng nghiêm ngặt khi dịch tự động.
            </span>
          </div>
        </div>

        {/* Subtitle Style Settings */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Palette size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cá nhân hóa phụ đề</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Cỡ chữ (px)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleChange('subtitleStyle.fontSize', Math.max(12, (localSettings.subtitleStyle.fontSize || 24) - 2))}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: '#fff',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Giảm cỡ chữ"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  className="form-input"
                  style={{ height: '38px', fontSize: '0.9rem', padding: '4px', width: '60px', textAlign: 'center', margin: 0 }}
                  min={12}
                  max={150}
                  value={localSettings.subtitleStyle.fontSize}
                  onChange={(e) => handleChange('subtitleStyle.fontSize', Math.min(150, Math.max(12, parseInt(e.target.value) || 24)))}
                />
                <button
                  type="button"
                  onClick={() => handleChange('subtitleStyle.fontSize', Math.min(150, (localSettings.subtitleStyle.fontSize || 24) + 2))}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: '#fff',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Tăng cỡ chữ"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Màu chữ</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  className="form-input"
                  style={{ width: '45px', padding: '2px', height: '40px', cursor: 'pointer' }}
                  value={localSettings.subtitleStyle.color}
                  onChange={(e) => handleChange('subtitleStyle.color', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ flexGrow: 1 }}
                  value={localSettings.subtitleStyle.color}
                  onChange={(e) => handleChange('subtitleStyle.color', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Màu viền chữ</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  className="form-input"
                  style={{ width: '45px', padding: '2px', height: '40px', cursor: 'pointer' }}
                  value={localSettings.subtitleStyle.outlineColor}
                  onChange={(e) => handleChange('subtitleStyle.outlineColor', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ flexGrow: 1 }}
                  value={localSettings.subtitleStyle.outlineColor}
                  onChange={(e) => handleChange('subtitleStyle.outlineColor', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Độ rộng viền (px)</label>
              <input
                type="number"
                className="form-input"
                min={0}
                max={10}
                value={localSettings.subtitleStyle.outlineWidth}
                onChange={(e) => handleChange('subtitleStyle.outlineWidth', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nền phụ đề (CSS)</label>
              <input
                type="text"
                className="form-input"
                value={localSettings.subtitleStyle.bgColor}
                onChange={(e) => handleChange('subtitleStyle.bgColor', e.target.value)}
                placeholder="rgba(0,0,0,0.5)"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lề dưới phụ đề (%)</label>
              <input
                type="number"
                className="form-input"
                min={5}
                max={80}
                value={localSettings.subtitleStyle.posY !== undefined ? localSettings.subtitleStyle.posY : 12}
                onChange={(e) => handleChange('subtitleStyle.posY', parseInt(e.target.value) || 12)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Thanh trượt vị trí dọc: {localSettings.subtitleStyle.posY !== undefined ? localSettings.subtitleStyle.posY : 12}%</label>
              <input
                type="range"
                min={5}
                max={80}
                step={1}
                style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                value={localSettings.subtitleStyle.posY !== undefined ? localSettings.subtitleStyle.posY : 12}
                onChange={(e) => handleChange('subtitleStyle.posY', parseInt(e.target.value) || 12)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thanh trượt vị trí ngang: {localSettings.subtitleStyle.posX !== undefined ? localSettings.subtitleStyle.posX : 50}%</label>
              <input
                type="range"
                min={5}
                max={95}
                step={1}
                style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                value={localSettings.subtitleStyle.posX !== undefined ? localSettings.subtitleStyle.posX : 50}
                onChange={(e) => handleChange('subtitleStyle.posX', parseInt(e.target.value) || 50)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={localSettings.subtitleStyle.showBgStrip || false}
                  onChange={(e) => handleChange('subtitleStyle.showBgStrip', e.target.checked)}
                  style={{ accentColor: 'var(--accent-purple)' }}
                />
                Dải nền che Sub gốc
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">Vị trí Y dải nền (%)</label>
              <input
                type="number"
                className="form-input"
                min={2}
                max={50}
                value={localSettings.subtitleStyle.bgStripPosY !== undefined ? localSettings.subtitleStyle.bgStripPosY : 12}
                onChange={(e) => handleChange('subtitleStyle.bgStripPosY', parseInt(e.target.value) || 12)}
                disabled={!localSettings.subtitleStyle.showBgStrip}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Chiều cao dải nền (%)</label>
              <input
                type="number"
                className="form-input"
                min={4}
                max={30}
                value={localSettings.subtitleStyle.bgStripHeight !== undefined ? localSettings.subtitleStyle.bgStripHeight : 8}
                onChange={(e) => handleChange('subtitleStyle.bgStripHeight', parseInt(e.target.value) || 8)}
                disabled={!localSettings.subtitleStyle.showBgStrip}
              />
            </div>
          </div>

          {/* Subtitle Preview */}
          <div style={{ marginTop: '24px' }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={16} /> Xem trước hiển thị phụ đề:
            </span>
            <div
              style={{
                width: '100%',
                height: '140px',
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: '1px dashed var(--border-color)'
              }}
            >
              {localSettings.subtitleStyle.showBgStrip && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: `${localSettings.subtitleStyle.bgStripPosY !== undefined ? localSettings.subtitleStyle.bgStripPosY : 12}%`,
                    left: 0,
                    right: 0,
                    height: `${localSettings.subtitleStyle.bgStripHeight !== undefined ? localSettings.subtitleStyle.bgStripHeight : 8}%`,
                    background: '#0a0a0f',
                    opacity: 0.95,
                    transform: 'translateY(50%)',
                    zIndex: 1
                  }}
                />
              )}
              <span
                style={{
                  position: 'absolute',
                  bottom: `${localSettings.subtitleStyle.posY !== undefined ? localSettings.subtitleStyle.posY : 12}%`,
                  left: `${localSettings.subtitleStyle.posX !== undefined ? localSettings.subtitleStyle.posX : 50}%`,
                  transform: 'translateX(-50%)',
                  fontSize: `${localSettings.subtitleStyle.fontSize}px`,
                  color: localSettings.subtitleStyle.color,
                  backgroundColor: localSettings.subtitleStyle.bgColor,
                  zIndex: 2,
                  textShadow: `
                    -${localSettings.subtitleStyle.outlineWidth}px -${localSettings.subtitleStyle.outlineWidth}px 0 ${localSettings.subtitleStyle.outlineColor},  
                     ${localSettings.subtitleStyle.outlineWidth}px -${localSettings.subtitleStyle.outlineWidth}px 0 ${localSettings.subtitleStyle.outlineColor},
                    -${localSettings.subtitleStyle.outlineWidth}px  ${localSettings.subtitleStyle.outlineWidth}px 0 ${localSettings.subtitleStyle.outlineColor},
                     ${localSettings.subtitleStyle.outlineWidth}px  ${localSettings.subtitleStyle.outlineWidth}px 0 ${localSettings.subtitleStyle.outlineColor}
                  `,
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontWeight: 500,
                  textAlign: 'center',
                  maxWidth: '85%'
                }}
              >
                Xin chào! Đây là phụ đề mẫu.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
