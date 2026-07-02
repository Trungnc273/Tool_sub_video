import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectVideo: () => ipcRenderer.invoke('select-video'),
  extractAudio: (videoPath: string, outputPath: string) =>
    ipcRenderer.invoke('extract-audio', videoPath, outputPath),
  burnSubtitles: (
    videoPath: string,
    subtitlesContent: string,
    outputPath: string,
    options?: {
      enableTts?: boolean
      apiKey?: string
      baseUrl?: string
      elevenLabsApiKey?: string
      voice?: string
      bgVolume?: number
      ttsVolume?: number
      exportGreenScreen?: boolean
      speed?: number
      autoSpeed?: boolean
      segments?: any[]
      trimStart?: number
      trimEnd?: number
      audioOffset?: number
      isFlippedHorizontal?: boolean
      isFlippedVertical?: boolean
      videoRotation?: number
    }
  ) => ipcRenderer.invoke('burn-subtitles', videoPath, subtitlesContent, outputPath, options),
  reverseVideo: (videoPath: string, outputPath: string) =>
    ipcRenderer.invoke('reverse-video', videoPath, outputPath),
  saveSubtitleFile: (srtContent: string, defaultName: string) =>
    ipcRenderer.invoke('save-subtitle-file', srtContent, defaultName),
  selectSaveVideoPath: (defaultName: string) =>
    ipcRenderer.invoke('select-save-video-path', defaultName),
  selectSaveAudioPath: (defaultName: string) =>
    ipcRenderer.invoke('select-save-audio-path', defaultName),
  exportDubbedAudio: (outputPath: string, segments: any[], options: any) =>
    ipcRenderer.invoke('export-dubbed-audio', outputPath, segments, options),
  callWhisperApi: (params: { apiKey: string; baseUrl?: string; audioPath: string; language?: string; prompt?: string }) =>
    ipcRenderer.invoke('call-whisper-api', params),
  callGptApi: (params: { apiKey: string; baseUrl?: string; model?: string; messages: any[] }) =>
    ipcRenderer.invoke('call-gpt-api', params),
  previewTtsVoice: (voice: string, apiKey: string, baseUrl?: string, elevenLabsApiKey?: string, speed?: number) =>
    ipcRenderer.invoke('preview-tts-voice', voice, apiKey, baseUrl, elevenLabsApiKey, speed),
  getTtsAudio: (params: { text: string; voice: string; apiKey: string; baseUrl?: string; elevenLabsApiKey?: string; speed?: number }) =>
    ipcRenderer.invoke('get-tts-audio', params),
  extractEmbeddedSubtitles: (videoPath: string) =>
    ipcRenderer.invoke('extract-embedded-subtitles', videoPath),
  onFfmpegProgress: (callback: (data: { type: string; percent: number }) => void) => {
    const subscription = (_event, data) => callback(data)
    ipcRenderer.on('ffmpeg-progress', subscription)
    return () => {
      ipcRenderer.removeListener('ffmpeg-progress', subscription)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
