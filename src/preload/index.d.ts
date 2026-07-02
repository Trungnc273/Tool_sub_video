import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectVideo: () => Promise<{ filePath: string; fileName: string; size: number } | null>
      extractAudio: (videoPath: string, outputPath: string) => Promise<boolean>
      burnSubtitles: (
        videoPath: string,
        srtContent: string,
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
      ) => Promise<boolean>
      reverseVideo: (videoPath: string, outputPath: string) => Promise<boolean>
      saveSubtitleFile: (srtContent: string, defaultName: string) => Promise<boolean>
      selectSaveVideoPath: (defaultName: string) => Promise<string | null>
      selectSaveAudioPath: (defaultName: string) => Promise<string | null>
      exportDubbedAudio: (
        outputPath: string,
        segments: any[],
        options: {
          apiKey?: string
          baseUrl?: string
          elevenLabsApiKey?: string
          voice?: string
          ttsVolume?: number
          speed?: number
          autoSpeed?: boolean
          trimStart?: number
          trimEnd?: number
          audioOffset?: number
        }
      ) => Promise<boolean>
      callWhisperApi: (params: {
        apiKey: string
        baseUrl?: string
        audioPath: string
        language?: string
        prompt?: string
      }) => Promise<{
        text: string
        words: { word: string; start: number; end: number }[]
        segments: { start: number; end: number; text: string }[]
      }>
      callGptApi: (params: {
        apiKey: string
        baseUrl?: string
        model?: string
        messages: any[]
      }) => Promise<string>
      previewTtsVoice: (voice: string, apiKey: string, baseUrl?: string, elevenLabsApiKey?: string, speed?: number) => Promise<string>
      getTtsAudio: (params: {
        text: string
        voice: string
        apiKey: string
        baseUrl?: string
        elevenLabsApiKey?: string
        speed?: number
      }) => Promise<string>
      extractEmbeddedSubtitles: (videoPath: string) => Promise<string>
      saveSecureSetting: (key: string, value: string) => Promise<boolean>
      loadSecureSetting: (key: string) => Promise<string>
      isEncryptionAvailable: () => Promise<boolean>
      onFfmpegProgress: (callback: (data: { type: string; percent: number }) => void) => () => void
    }
  }
}
export {}
