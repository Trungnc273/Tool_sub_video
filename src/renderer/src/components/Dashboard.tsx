import React, { useState } from 'react'
import { FolderOpen, Film, Trash2, PlusCircle, Loader } from 'lucide-react'

export interface Project {
  id: string
  name: string
  videoPath: string
  videoName: string
  audioPath: string
  size: string
  createdAt: number
  srtContent: string
}

interface DashboardProps {
  projects: Project[]
  onSelectProject: (project: Project) => void
  onCreateProject: (project: Project) => void
  onDeleteProject: (id: string) => void
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  const handleCreateNewProject = async () => {
    try {
      // 1. Select Video
      const video = await window.api.selectVideo()
      if (!video) return // user canceled

      setIsProcessing(true)
      setProgress(0)
      setStatusMessage('Đang phân tích cấu trúc video...')

      // 2. Determine Audio Path (next to video file)
      const lastDot = video.filePath.lastIndexOf('.')
      const audioPath = video.filePath.substring(0, lastDot) + '_sub_audio.mp3'

      setStatusMessage('Đang tách âm thanh bằng FFmpeg...')

      // 3. Listen to FFmpeg progress
      const cleanupProgress = window.api.onFfmpegProgress((data) => {
        if (data.type === 'extract-audio') {
          setProgress(data.percent)
        }
      })

      // 4. Run audio extraction
      await window.api.extractAudio(video.filePath, audioPath)
      cleanupProgress()

      // 5. Create new Project Object
      const formatSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024)
        return mb.toFixed(1) + ' MB'
      }

      const newProject: Project = {
        id: Math.random().toString(36).substring(2, 9),
        name: video.fileName.substring(0, video.fileName.lastIndexOf('.')),
        videoPath: video.filePath,
        videoName: video.fileName,
        audioPath,
        size: formatSize(video.size),
        createdAt: Date.now(),
        srtContent: ''
      }

      setIsProcessing(false)
      onCreateProject(newProject)
    } catch (error: any) {
      console.error(error)
      alert('Có lỗi xảy ra khi xử lý video: ' + error.message)
      setIsProcessing(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {isProcessing && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(7, 8, 12, 0.85)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '40px',
              width: '400px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}
          >
            <Loader size={40} className="animate-spin" color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{statusMessage}</h3>

            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-indigo))',
                  transition: 'width 0.2s ease',
                  boxShadow: '0 0 10px var(--accent-purple)'
                }}
              />
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Tiến trình: {progress}%
            </span>
          </div>
        </div>
      )}

      {/* Hero Header / Create Action */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: '32px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.03) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              marginBottom: '8px',
              background: 'linear-gradient(to right, #ffffff, #9ca3af)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Chào mừng đến với VietSub Pro
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '500px' }}>
            Ứng dụng hỗ trợ phụ đề tự động bằng trí tuệ nhân tạo. Chỉ cần chọn video, Whisper và GPT-4o sẽ giúp bạn
            nhận diện và dịch thuật phụ đề nhanh chóng trong vài giây.
          </p>
        </div>

        <button
          onClick={handleCreateNewProject}
          className="glass-panel"
          style={{
            padding: '32px',
            border: '2px dashed var(--accent-purple)',
            background: 'rgba(139, 92, 246, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.07)'
            e.currentTarget.style.borderColor = '#c084fc'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.03)'
            e.currentTarget.style.borderColor = 'var(--accent-purple)'
          }}
        >
          <PlusCircle size={36} color="var(--accent-purple)" />
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Tạo Dự Án Mới</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chọn video từ máy tính</span>
        </button>
      </div>

      {/* Projects List */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Dự án gần đây
        </h3>

        {projects.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '60px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              gap: '12px'
            }}
          >
            <FolderOpen size={40} strokeWidth={1.5} />
            <p style={{ fontSize: '0.95rem' }}>Bạn chưa có dự án nào.</p>
            <button className="btn btn-secondary btn-outline" onClick={handleCreateNewProject}>
              Bắt đầu ngay
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}
          >
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => onSelectProject(proj)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-purple)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  const btn = e.currentTarget.querySelector('.delete-btn') as HTMLElement
                  if (btn) btn.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  const btn = e.currentTarget.querySelector('.delete-btn') as HTMLElement
                  if (btn) btn.style.opacity = '0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <Film size={20} color="var(--accent-indigo)" />
                  </div>
                  <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                    <h4
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '2px'
                      }}
                    >
                      {proj.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Dung lượng: {proj.size}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)'
                  }}
                >
                  <span>{new Date(proj.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span>{proj.srtContent ? 'Đã có phụ đề' : 'Chưa có phụ đề'}</span>
                </div>

                {/* Delete Button */}
                <button
                  className="delete-btn"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f87171',
                    opacity: 0,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation() // prevent opening project
                    if (confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
                      onDeleteProject(proj.id)
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
