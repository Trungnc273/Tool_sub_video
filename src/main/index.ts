import { app, shell, BrowserWindow, ipcMain, dialog, protocol, safeStorage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { transcribeWithLocalWhisper, checkPythonEnvironment, isModelDownloaded } from './whisper-local'
import { spawn } from 'child_process'
import { createReadStream, promises as fs } from 'fs'
import { createHash } from 'crypto'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'
import { URL } from 'url'
import { Communicate } from 'edge-tts-ts'
import ffmpegStaticPath from 'ffmpeg-static'
import { existsSync } from 'fs'

// FFmpeg được bundle qua ffmpeg-static; khi đóng gói asar, binary nằm ở app.asar.unpacked
const ffmpegPath = (ffmpegStaticPath as unknown as string).replace(
  'app.asar',
  'app.asar.unpacked'
)

function assertFfmpegAvailable(): void {
  if (!ffmpegPath || !existsSync(ffmpegPath)) {
    throw new Error(
      'Không tìm thấy công cụ xử lý video (FFmpeg) đi kèm ứng dụng. Vui lòng cài đặt lại ứng dụng.'
    )
  }
}


// Register media scheme as privileged to bypass CSP and allow streaming
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { standard: true, bypassCSP: true, stream: true, supportFetchAPI: true, corsEnabled: true } }
])

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Convert HH:MM:SS.mmm to seconds
function durationToSeconds(durationStr: string): number {
  const parts = durationStr.split(':')
  if (parts.length !== 3) return 0
  const hours = parseFloat(parts[0])
  const minutes = parseFloat(parts[1])
  const seconds = parseFloat(parts[2].replace(',', '.'))
  return hours * 3600 + minutes * 60 + seconds
}

function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const ffmpeg = spawn(ffmpegPath, ['-i', videoPath])
      let output = ''
      ffmpeg.stderr.on('data', (data) => {
        output += data.toString()
      })
      ffmpeg.on('close', () => {
        const match = output.match(/Duration:\s*(\d{2}:\d{2}:\d{2}\.\d{2})/)
        if (match) {
          resolve(durationToSeconds(match[1]))
        } else {
          resolve(0)
        }
      })
      ffmpeg.on('error', (err) => {
        console.error('[getVideoDuration spawn error]:', err)
        resolve(0)
      })
    } catch (e) {
      console.error('[getVideoDuration error]:', e)
      resolve(0)
    }
  })
}

// (Đã bỏ estimateTextDuration/getSegmentSpeechSpeed — tốc độ tự động giờ ĐO thời lượng
// thật của audio TTS rồi nén bằng atempo, xem docs/specs/04-dubbing-quality/SPEC.md)

// --- Secure settings storage (API keys) ---
// Keys are encrypted with OS-level encryption (DPAPI on Windows) via safeStorage,
// stored as base64 in userData/secure-settings.json. Never log decrypted values.
const SECURE_SETTINGS_FILE = (): string => path.join(app.getPath('userData'), 'secure-settings.json')
const ALLOWED_SECURE_KEYS = ['apiKey', 'elevenLabsApiKey']

async function readSecureFile(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(SECURE_SETTINGS_FILE(), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function registerSecureSettingHandlers(): void {
  ipcMain.handle('save-secure-setting', async (_, key: string, value: string) => {
    if (!ALLOWED_SECURE_KEYS.includes(key)) {
      throw new Error(`Không hỗ trợ lưu bảo mật cho khóa: ${key}`)
    }
    const store = await readSecureFile()
    if (!value) {
      delete store[key]
    } else if (safeStorage.isEncryptionAvailable()) {
      store[key] = 'enc:' + safeStorage.encryptString(value).toString('base64')
    } else {
      // FR4: fallback plaintext — renderer đã cảnh báo người dùng trước khi gọi
      store[key] = 'plain:' + Buffer.from(value, 'utf-8').toString('base64')
    }
    await fs.writeFile(SECURE_SETTINGS_FILE(), JSON.stringify(store), 'utf-8')
    return true
  })

  ipcMain.handle('load-secure-setting', async (_, key: string) => {
    if (!ALLOWED_SECURE_KEYS.includes(key)) return ''
    const store = await readSecureFile()
    const stored = store[key]
    if (!stored) return ''
    try {
      if (stored.startsWith('enc:')) {
        return safeStorage.decryptString(Buffer.from(stored.slice(4), 'base64'))
      }
      if (stored.startsWith('plain:')) {
        return Buffer.from(stored.slice(6), 'base64').toString('utf-8')
      }
      return ''
    } catch {
      // File hỏng hoặc copy từ máy khác — coi như chưa có key, không crash (SPEC mục 6)
      console.error(`[secure-setting] Không giải mã được khóa ${key} (không log giá trị)`)
      return ''
    }
  })

  ipcMain.handle('is-encryption-available', () => safeStorage.isEncryptionAvailable())
  // Hiển thị đúng phiên bản đang chạy trong UI — trước đây "Phiên bản 1.0.0" bị gắn
  // cứng, không phản ánh bản build thật, gây khó khi cần xác minh máy khách chạy bản nào
  ipcMain.handle('get-app-version', () => app.getVersion())
}

// Register IPC Handlers
function registerIpcHandlers(): void {
  registerSecureSettingHandlers()
  // 1. Select Video
  ipcMain.handle('select-video', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'avi', 'mov', 'flv', 'wmv'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const stats = await fs.stat(filePath)
    return {
      filePath,
      fileName: path.basename(filePath),
      size: stats.size
    }
  })

  // 2. Extract Audio
  ipcMain.handle('extract-audio', async (event, videoPath, outputPath) => {
    assertFfmpegAvailable()
    const duration = await getVideoDuration(videoPath)

    // Bitrate cố định 64k (điểm ngọt của Whisper) — KHÔNG hạ bitrate theo độ dài video
    // nữa vì làm nát âm thanh, Whisper bỏ sót lời. File >24MB sẽ được chia khúc khi
    // chuyển ngữ (xem call-whisper-api), nên không cần ép cả video vào 25MB.
    console.log(`[extract-audio] duration: ${duration}s, bitrate 64k + speech filters`)

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath, [
        '-i',
        videoPath,
        '-vn',
        '-ar',
        '16000',
        '-ac',
        '1',
        // Tăng cường giọng nói cho video nhiều nhạc nền/tạp âm:
        // highpass 70Hz cắt ù/bass nhạc; loudnorm kéo giọng nói nhỏ lên đều
        '-af',
        'highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11',
        '-ab',
        '64k',
        outputPath,
        '-y'
      ])

      let extractDuration = duration || 0
      ffmpeg.stderr.on('data', (data) => {
        const text = data.toString()
        if (extractDuration === 0) {
          const durMatch = text.match(/Duration:\s*(\d{2}:\d{2}:\d{2}\.\d{2})/)
          if (durMatch) {
            extractDuration = durationToSeconds(durMatch[1])
          }
        }
        const timeMatch = text.match(/time=\s*(\d{2}:\d{2}:\d{2}\.\d{2})/)
        if (timeMatch && extractDuration > 0) {
          const time = durationToSeconds(timeMatch[1])
          const percent = Math.min(99, Math.round((time / extractDuration) * 100))
          event.sender.send('ffmpeg-progress', { type: 'extract-audio', percent })
        }
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          event.sender.send('ffmpeg-progress', { type: 'extract-audio', percent: 100 })
          resolve(true)
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`))
        }
      })

      ffmpeg.on('error', (err) => {
        reject(err)
      })
    })
  })

  // 3. Burn Subtitles (Hardsub)
function callOpenAiTts(apiKey: string, baseUrl: string, text: string, voice?: string, speed?: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const rawUrl = `${baseUrl || 'https://api.openai.com/v1'}/audio/speech`
      const parsedUrl = new URL(rawUrl)
      
      const payload: any = {
        model: 'tts-1',
        input: text,
        voice: voice || 'alloy'
      }
      if (speed !== undefined) {
        payload.speed = speed
      }
      const postData = JSON.stringify(payload)

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }

      const client = parsedUrl.protocol === 'https:' ? https : http

      const req = client.request(options, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          let errBody = ''
          res.on('data', (chunk) => {
            errBody += chunk
          })
          res.on('end', () => {
            reject(new Error(`OpenAI TTS API error: ${res.statusCode} - ${errBody}`))
          })
          return
        }

        const chunks: Buffer[] = []
        res.on('data', (chunk) => {
          chunks.push(chunk)
        })
        res.on('end', () => {
          resolve(Buffer.concat(chunks))
        })
      })

      req.on('error', (err) => {
        reject(err)
      })

      req.write(postData)
      req.end()
    } catch (e) {
      reject(e)
    }
  })
}

function callElevenLabsTts(apiKey: string, text: string, voiceId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const rawUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
      const parsedUrl = new URL(rawUrl)
      
      const postData = JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }

      const req = https.request(options, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          let errBody = ''
          res.on('data', (chunk) => {
            errBody += chunk
          })
          res.on('end', () => {
            reject(new Error(`ElevenLabs TTS API error: ${res.statusCode} - ${errBody}`))
          })
          return
        }

        const chunks: Buffer[] = []
        res.on('data', (chunk) => {
          chunks.push(chunk)
        })
        res.on('end', () => {
          resolve(Buffer.concat(chunks))
        })
      })

      req.on('error', (err) => {
        reject(err)
      })

      req.write(postData)
      req.end()
    } catch (e) {
      reject(e)
    }
  })
}

function callEdgeTtsOnce(text: string, voice: string, speed?: number): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const cleanText = text.replace(/\{[^}]*\}/g, '').replace(/\\N/g, ' ').trim()
      if (!cleanText) {
        resolve(Buffer.alloc(0))
        return
      }

      const ttsVoice = voice === 'edge_hoaimy' ? 'vi-VN-HoaiMyNeural' : 'vi-VN-NamMinhNeural'
      
      // Calculate rate string for Edge TTS (e.g. +15%)
      const speedFactor = speed !== undefined ? speed : 1.0
      const percentage = Math.round((speedFactor - 1.0) * 100)
      const rateStr = percentage >= 0 ? `+${percentage}%` : `${percentage}%`

      console.log(`[Edge TTS] Requesting synthesis via Communicate (len: ${cleanText.length}, speed: ${speedFactor}, rate: ${rateStr}): "${cleanText.substring(0, 60)}..."`)
      
      const communicate = new Communicate(cleanText, { voice: ttsVoice, rate: rateStr })
      const chunks: Buffer[] = []

      // Watchdog theo TIẾN ĐỘ: chỉ hủy khi 10s không nhận thêm dữ liệu nào.
      // (Trần cứng 6s cũ hủy oan các câu dài đang sinh dở → câu bị bỏ, "đọc thiếu")
      let timeoutId: NodeJS.Timeout | undefined
      const resetWatchdog = (): void => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          reject(new Error('Edge TTS không phản hồi trong 10s'))
        }, 10000)
      }
      resetWatchdog()

      try {
        for await (const chunk of communicate.stream()) {
          resetWatchdog()
          if (chunk.type === 'audio') {
            chunks.push(Buffer.from(chunk.data))
          }
        }
        clearTimeout(timeoutId)
        if (chunks.length > 0) {
          resolve(Buffer.concat(chunks))
        } else {
          reject(new Error('No audio chunks received from Edge TTS'))
        }
      } catch (streamErr) {
        clearTimeout(timeoutId)
        reject(streamErr)
      }
    } catch (e) {
      reject(e)
    }
  })
}

async function callEdgeTts(text: string, voice: string, speed?: number): Promise<Buffer> {
  const maxRetries = 3
  let lastError: any = null
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const buf = await callEdgeTtsOnce(text, voice, speed)
      return buf
    } catch (err: any) {
      console.warn(`[Edge TTS Attempt ${attempt} failed]:`, err.message)
      lastError = err
      // Wait a short time before retrying
      await new Promise((resolve) => setTimeout(resolve, attempt * 500))
    }
  }
  throw lastError || new Error('Failed after maximum retries')
}

// --- TTS hợp nhất: một nơi duy nhất quyết định nhà cung cấp/giọng (spec 04 FR4) ---
// Trước đây khối logic này bị copy-paste 4 chỗ — thêm giọng mới phải sửa cả 4, dễ sót.
const OPENAI_TTS_VOICES = ['nova', 'shimmer', 'alloy', 'fable', 'echo', 'onyx', 'ash', 'sage', 'coral']
const ELEVEN_VOICE_IDS: Record<string, string> = {
  eleven_rachel: '21m0aEP3W9q0441cE85e',
  eleven_antoni: 'ErXwobaYiN019PkySvjV',
  eleven_nicole: 'piTKgcLEGmPEe24vB4R2b',
  eleven_adam: 'pNInz6obpgDQ51uflcfy',
  eleven_bella: 'EXAVITQu4vr4xnSDxMaL'
}

interface TtsOptions {
  apiKey?: string
  baseUrl?: string
  elevenLabsApiKey?: string
  speed?: number
}

async function synthesizeSpeech(text: string, voice: string, opts: TtsOptions): Promise<Buffer> {
  if (voice === 'edge_hoaimy' || voice === 'edge_namminh') {
    return callEdgeTts(text, voice, opts.speed)
  }
  if (OPENAI_TTS_VOICES.includes(voice.toLowerCase())) {
    return callOpenAiTts(opts.apiKey || '', opts.baseUrl || '', text, voice, opts.speed)
  }
  // ElevenLabs: voice là alias (eleven_*) hoặc voiceId trực tiếp.
  // API ElevenLabs không có tham số tốc độ — tốc độ xử lý bằng atempo lúc trộn (FR2).
  const voiceId = ELEVEN_VOICE_IDS[voice] || voice
  return callElevenLabsTts(opts.elevenLabsApiKey || '', text, voiceId)
}

// Cache TTS dùng chung cho Nghe thử + Xuất video + Xuất audio (spec 04 FR3):
// xuất lại chỉ sinh câu đã đổi, không trả phí lại toàn bộ.
async function getOrSynthesizeTts(
  text: string,
  voice: string,
  opts: TtsOptions
): Promise<{ filePath: string; fromCache: boolean }> {
  const hash = createHash('md5').update(`${text}_${voice}_${opts.speed || 1.0}`).digest('hex')
  const cacheDir = path.join(app.getPath('userData'), 'tts_cache')
  await fs.mkdir(cacheDir, { recursive: true })
  const filePath = path.join(cacheDir, `${hash}.mp3`)
  try {
    await fs.access(filePath)
    return { filePath, fromCache: true }
  } catch {
    // chưa có cache — sinh mới
  }
  const buffer = await synthesizeSpeech(text, voice, opts)
  await fs.writeFile(filePath, buffer)
  return { filePath, fromCache: false }
}

  // 3. Burn Subtitles (Hardsub & Optional TTS Mix)
  ipcMain.handle('burn-subtitles', async (event, videoPath, assContent, outputPath, options) => {
    assertFfmpegAvailable()
    const outputDir = path.dirname(outputPath)
    const tempAssPath = path.join(outputDir, `temp_${Date.now()}.ass`)
    const tempAssName = path.basename(tempAssPath)
    
    const ttsTempDir = path.join(outputDir, `tts_temp_${Date.now()}`)
    const createdTempPaths: string[] = []

    return new Promise(async (resolve, reject) => {
      try {
        await fs.writeFile(tempAssPath, assContent, 'utf-8')

        const trimStart = options?.trimStart !== undefined ? options.trimStart : 0
        const trimEnd = options?.trimEnd !== undefined ? options.trimEnd : 0
        const audioOffset = options?.audioOffset !== undefined ? options.audioOffset : 0

        let seekArgs: string[] = []
        if (trimStart > 0) {
          seekArgs.push('-ss', (trimStart / 1000).toFixed(3))
        }
        if (trimEnd > 0 && trimEnd > trimStart) {
          const durationS = (trimEnd - trimStart) / 1000
          seekArgs.push('-t', durationS.toFixed(3))
        }

        let ffmpegArgs = [...seekArgs, '-i', videoPath]
        const voice = options?.voice || 'alloy'
        const isEdgeTts = voice === 'edge_hoaimy' || voice === 'edge_namminh'
        const openAiVoices = ['nova', 'shimmer', 'alloy', 'fable', 'echo', 'onyx', 'ash', 'sage', 'coral']
        const isElevenLabs = voice && !openAiVoices.includes(voice.toLowerCase()) && !isEdgeTts
        let hasVoiceApiKey = false
        if (isEdgeTts) {
          hasVoiceApiKey = true
        } else if (isElevenLabs) {
          hasVoiceApiKey = !!options?.elevenLabsApiKey
        } else {
          hasVoiceApiKey = !!options?.apiKey
        }
        const enableTts = options?.enableTts && hasVoiceApiKey
        const bgVolume = options?.bgVolume !== undefined ? options.bgVolume : 0.3
        const ttsVolume = options?.ttsVolume !== undefined ? options.ttsVolume : 1.0
        const exportGreenScreen = !!options?.exportGreenScreen
        
        const isFlippedHorizontal = !!options?.isFlippedHorizontal
        const isFlippedVertical = !!options?.isFlippedVertical
        const videoRotation = options?.videoRotation || 0

        let videoFilters: string[] = []
        if (isFlippedHorizontal) {
          videoFilters.push('hflip')
        }
        if (isFlippedVertical) {
          videoFilters.push('vflip')
        }
        if (videoRotation === 90) {
          videoFilters.push('transpose=1')
        } else if (videoRotation === 180) {
          videoFilters.push('transpose=1,transpose=1')
        } else if (videoRotation === 270) {
          videoFilters.push('transpose=2')
        }
        
        if (exportGreenScreen) {
          videoFilters.push('drawbox=x=0:y=0:w=iw:h=ih:color=0x00FF00:t=fill')
        }
        videoFilters.push(`ass=${tempAssName}`)

        const vfValue = videoFilters.join(',')
        
        if (enableTts) {
          // Mốc lồng tiếng lấy TRỰC TIẾP từ segments (mốc nói thật) — không parse ngược
          // từ ASS vì ASS mang mốc HIỂN THỊ (đã trừ lead-in 200ms), làm giọng cất lên
          // trước khi nhân vật mở miệng (spec 05 FR4).
          const ttsSegments: {
            index: number
            startMs: number
            durationS: number // slot an toàn: tới lúc câu sau bắt đầu
            speechS: number // khung nói thật của câu — mục tiêu khớp tốc độ (FR3)
            text: string
            audioOffset?: number
          }[] = []
          let segIndex = 1

          const segs: { start: number; end: number; translatedText?: string; audioOffset?: number }[] =
            options?.segments || []
          for (let i = 0; i < segs.length; i++) {
            const current = segs[i]
            const next = segs[i + 1]

            // Slot an toàn: tới khi câu sau bắt đầu (câu cuối cho phép tối đa 300s)
            const availableDurationS = next
              ? Math.max(0.1, (next.start - current.start) / 1000)
              : 300.0

            const textToSpeak = current.translatedText || ''
            const cleanText = textToSpeak.replace(/\{[^}]*\}/g, '').replace(/\\N/g, ' ').replace(/\n/g, ' ').trim()
            if (cleanText) {
              ttsSegments.push({
                index: segIndex++,
                startMs: current.start,
                durationS: availableDurationS,
                speechS: Math.max(0.3, (current.end - current.start) / 1000),
                text: cleanText,
                audioOffset: current.audioOffset || 0
              })
            }
          }
          
          if (ttsSegments.length > 0) {
            const total = ttsSegments.length
            let completed = 0

            event.sender.send('ffmpeg-progress', { type: 'burn-subtitles', percent: 0 })

            const baseSpeed = options?.speed || 1.0
            const autoSpeed = !!options?.autoSpeed
            // Sinh (hoặc lấy cache) ở tốc độ gốc; khớp slot bằng atempo sau khi ĐO thời
            // lượng thật (spec 04 FR2) — không ước lượng đếm từ, không cắt cụt lời.
            const readySegs: { seg: (typeof ttsSegments)[number]; filePath: string; fitTempo: number }[] = []

            for (const seg of ttsSegments) {
              try {
                const { filePath, fromCache } = await getOrSynthesizeTts(seg.text, voice, {
                  apiKey: options?.apiKey,
                  baseUrl: options?.baseUrl,
                  elevenLabsApiKey: options?.elevenLabsApiKey,
                  speed: baseSpeed
                })
                let fitTempo = 1
                if (autoSpeed) {
                  const actualDur = await getVideoDuration(filePath)
                  if (actualDur > 0) {
                    // Khớp HAI CHIỀU với khung nói thật: nén khi TTS dài hơn, kéo chậm khi
                    // ngắn hơn — đọc xong đúng lúc nhân vật nói xong. Giới hạn 0.7-1.8 giữ
                    // giọng tự nhiên (spec 05 FR3/FR5).
                    fitTempo = Math.min(1.8, Math.max(0.7, actualDur / seg.speechS))
                  }
                }
                readySegs.push({ seg, filePath, fitTempo })
                if (!fromCache) {
                  // 120ms delay to prevent rate limit — chỉ cần khi gọi API thật
                  await new Promise((resolve) => setTimeout(resolve, 120))
                }
              } catch (err) {
                console.error(`Error generating TTS for segment ${seg.index}:`, err)
              }
              completed++
              const percent = Math.min(40, Math.round((completed / total) * 40))
              event.sender.send('ffmpeg-progress', { type: 'burn-subtitles', percent })
            }

            const inputsArgs: string[] = []
            const delayFilters: string[] = []
            const mixLabels: string[] = []

            readySegs.forEach(({ seg, filePath, fitTempo }, idx) => {
              inputsArgs.push('-i', filePath)
              const inputIdx = idx + 1

              const durFormatted = seg.durationS.toFixed(3)
              const delayMs = Math.max(0, seg.startMs + (seg.audioOffset || 0) + audioOffset)
              // aresample đồng nhất sample rate (TTS 24kHz vs video 44.1/48kHz);
              // atempo nén thời gian đúng tỷ lệ đã đo; atrim giữ làm lưới an toàn cuối
              const tempoFilter = Math.abs(fitTempo - 1) > 0.02 ? `,atempo=${fitTempo.toFixed(3)}` : ''
              delayFilters.push(
                `[${inputIdx}:a]aresample=44100${tempoFilter},atrim=0:${durFormatted},asetpts=PTS-STARTPTS,volume=${ttsVolume},adelay=${delayMs}|${delayMs}[a${seg.index}]`
              )
              mixLabels.push(`[a${seg.index}]`)
            })

            const bgFilter = `[0:a]volume=${bgVolume}[abg]`
            // normalize=0: âm lượng đúng như thanh chỉnh, không bơm xẹp theo số câu
            // (bằng chứng đo peak PCM: filter cũ trồi 370→1109, normalize=0 phẳng 1228)
            const filterComplex = `${bgFilter};${delayFilters.join(';')};[abg]${mixLabels.join('')}amix=inputs=${readySegs.length + 1}:duration=first:dropout_transition=3:normalize=0[aout]`
            
            ffmpegArgs = [
              ...seekArgs,
              '-i', videoPath,
              ...inputsArgs,
              '-filter_complex', filterComplex,
              '-map', '0:v',
              '-map', '[aout]',
              '-vf', vfValue,
              '-c:v', 'libx264',
              '-pix_fmt', 'yuv420p',
              outputPath,
              '-y'
            ]
          } else {
            ffmpegArgs = [...seekArgs, '-i', videoPath, '-vf', vfValue, outputPath, '-y']
          }
        } else {
          ffmpegArgs = [...seekArgs, '-i', videoPath, '-vf', vfValue, outputPath, '-y']
        }

        const ffmpeg = spawn(ffmpegPath, ffmpegArgs, { cwd: outputDir })

        let duration = 0
        ffmpeg.stderr.on('data', (data) => {
          const text = data.toString()
          const durMatch = text.match(/Duration:\s*(\d{2}:\d{2}:\d{2}\.\d{2})/)
          if (durMatch) {
            duration = durationToSeconds(durMatch[1])
          }
          const timeMatch = text.match(/time=\s*(\d{2}:\d{2}:\d{2}\.\d{2})/)
          if (timeMatch && duration > 0) {
            const time = durationToSeconds(timeMatch[1])
            const startPercent = enableTts ? 40 : 0
            const scale = enableTts ? 0.6 : 1.0
            const percent = Math.min(99, startPercent + Math.round((time / duration) * 100 * scale))
            event.sender.send('ffmpeg-progress', { type: 'burn-subtitles', percent })
          }
        })

        ffmpeg.on('close', async (code) => {
          try {
            await fs.unlink(tempAssPath)
          } catch (e) {}
          
          for (const p of createdTempPaths) {
            try {
              await fs.unlink(p)
            } catch (e) {}
          }
          try {
            await fs.rm(ttsTempDir, { recursive: true, force: true })
          } catch (e) {}

          if (code === 0) {
            event.sender.send('ffmpeg-progress', { type: 'burn-subtitles', percent: 100 })
            resolve(true)
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`))
          }
        })

        ffmpeg.on('error', async (err) => {
          try {
            await fs.unlink(tempAssPath)
          } catch (e) {}
          
          for (const p of createdTempPaths) {
            try {
              await fs.unlink(p)
            } catch (e) {}
          }
          try {
            await fs.rm(ttsTempDir, { recursive: true, force: true })
          } catch (e) {}
          reject(err)
        })
      } catch (err) {
        reject(err)
      }
    })
  })

  // 3b. Export Dubbed Audio (Concatenated & delayed TTS MP3s)
  ipcMain.handle('export-dubbed-audio', async (event, outputPath, segments, options) => {
    assertFfmpegAvailable()
    const outputDir = path.dirname(outputPath)
    const ttsTempDir = path.join(outputDir, `tts_temp_audio_${Date.now()}`)
    const createdTempPaths: string[] = []

    return new Promise(async (resolve, reject) => {
      try {
        const voice = options?.voice || 'alloy'
        const ttsVolume = options?.ttsVolume !== undefined ? options.ttsVolume : 1.0
        const audioOffset = options?.audioOffset !== undefined ? options.audioOffset : 0
        const trimStart = options?.trimStart !== undefined ? options.trimStart : 0
        const trimEnd = options?.trimEnd !== undefined ? options.trimEnd : 0

        let outputArgs: string[] = []
        if (trimEnd > 0 && trimEnd > trimStart) {
          const durationS = (trimEnd - trimStart) / 1000
          outputArgs.push('-t', durationS.toFixed(3))
        }

        const ttsSegments: {
          index: number
          startMs: number
          durationS: number
          speechS: number
          text: string
          audioOffset?: number
        }[] = []
        let segIndex = 1

        for (let i = 0; i < segments.length; i++) {
          const current = segments[i]
          const next = segments[i + 1]

          const availableDurationS = next
            ? Math.max(0.1, (next.start - current.start) / 1000)
            : 300.0 // large default for the last segment

          const textToUse = current.translatedText || ''
          const cleanText = textToUse.replace(/\{[^}]*\}/g, '').replace(/\\N/g, ' ').replace(/\n/g, ' ').trim()
          if (cleanText) {
            ttsSegments.push({
              index: segIndex++,
              startMs: current.start,
              durationS: availableDurationS,
              speechS: Math.max(0.3, (current.end - current.start) / 1000),
              text: cleanText,
              audioOffset: current.audioOffset || 0
            })
          }
        }

        if (ttsSegments.length === 0) {
          throw new Error('Không có phụ đề nào để sinh giọng thuyết minh!')
        }

        const total = ttsSegments.length
        let completed = 0

        event.sender.send('ffmpeg-progress', { type: 'export-dubbed-audio', percent: 0 })

        const baseSpeed = options?.speed || 1.0
        const autoSpeed = !!options?.autoSpeed
        // Cùng cơ chế với burn-subtitles: cache dùng chung + đo thời lượng thật + atempo
        const readySegs: { seg: (typeof ttsSegments)[number]; filePath: string; fitTempo: number }[] = []

        for (const seg of ttsSegments) {
          try {
            const { filePath, fromCache } = await getOrSynthesizeTts(seg.text, voice, {
              apiKey: options?.apiKey,
              baseUrl: options?.baseUrl,
              elevenLabsApiKey: options?.elevenLabsApiKey,
              speed: baseSpeed
            })
            let fitTempo = 1
            if (autoSpeed) {
              const actualDur = await getVideoDuration(filePath)
              if (actualDur > 0) {
                // Khớp hai chiều với khung nói thật (spec 05 FR3/FR5)
                fitTempo = Math.min(1.8, Math.max(0.7, actualDur / seg.speechS))
              }
            }
            readySegs.push({ seg, filePath, fitTempo })
            if (!fromCache) {
              // 120ms delay to prevent rate limit — chỉ cần khi gọi API thật
              await new Promise((resolve) => setTimeout(resolve, 120))
            }
          } catch (err) {
            console.error(`Error generating TTS for segment ${seg.index}:`, err)
          }
          completed++
          const percent = Math.min(99, Math.round((completed / total) * 99))
          event.sender.send('ffmpeg-progress', { type: 'export-dubbed-audio', percent })
        }

        const inputsArgs: string[] = []
        const delayFilters: string[] = []
        const mixLabels: string[] = []

        if (readySegs.length === 0) {
          throw new Error('Không thể sinh giọng thuyết minh cho bất kỳ câu thoại nào!')
        }

        readySegs.forEach(({ seg, filePath, fitTempo }, idx) => {
          inputsArgs.push('-i', filePath)
          const inputIdx = idx

          const durFormatted = seg.durationS.toFixed(3)
          const delayMs = Math.max(0, seg.startMs + (seg.audioOffset || 0) + audioOffset)
          const tempoFilter = Math.abs(fitTempo - 1) > 0.02 ? `,atempo=${fitTempo.toFixed(3)}` : ''
          delayFilters.push(
            `[${inputIdx}:a]aresample=44100${tempoFilter},atrim=0:${durFormatted},asetpts=PTS-STARTPTS,volume=${ttsVolume},adelay=${delayMs}|${delayMs}[a${seg.index}]`
          )
          mixLabels.push(`[a${seg.index}]`)
        })

        // normalize=0: xem bằng chứng đo peak trong docs/specs/04-dubbing-quality/SPEC.md
        const filterComplex = `${delayFilters.join(';')};${mixLabels.join('')}amix=inputs=${readySegs.length}:duration=longest:dropout_transition=3:normalize=0[aout]`

        const ffmpegArgs = [
          ...inputsArgs,
          '-filter_complex', filterComplex,
          '-map', '[aout]',
          '-c:a', 'libmp3lame',
          '-q:a', '4',
          ...outputArgs,
          outputPath,
          '-y'
        ]

        const ffmpeg = spawn(ffmpegPath, ffmpegArgs, { cwd: outputDir })

        const cleanUpTemp = async () => {
          for (const p of createdTempPaths) {
            try {
              await fs.unlink(p)
            } catch (e) {}
          }
          try {
            await fs.rm(ttsTempDir, { recursive: true, force: true })
          } catch (e) {}
        }

        ffmpeg.on('close', async (code) => {
          await cleanUpTemp()
          if (code === 0) {
            event.sender.send('ffmpeg-progress', { type: 'export-dubbed-audio', percent: 100 })
            resolve(true)
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`))
          }
        })

        ffmpeg.on('error', async (err) => {
          await cleanUpTemp()
          reject(err)
        })
      } catch (err) {
        reject(err)
      }
    })
  })

  // 4. Save Subtitle File (SRT/ASS/VTT/TXT)
  ipcMain.handle('save-subtitle-file', async (_, srtContent, defaultName) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [
        { name: 'Subrip Subtitle', extensions: ['srt'] },
        { name: 'Advanced Substation Alpha', extensions: ['ass'] },
        { name: 'WebVTT', extensions: ['vtt'] },
        { name: 'Plain Text', extensions: ['txt'] }
      ]
    })
    if (result.canceled || !result.filePath) return false
    await fs.writeFile(result.filePath, srtContent, 'utf-8')
    return true
  })

  // 4b. Select Save Video Path
  ipcMain.handle('select-save-video-path', async (_, defaultName) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
    })
    if (result.canceled || !result.filePath) return null
    return result.filePath
  })

  // 4c. Select Save Audio Path
  ipcMain.handle('select-save-audio-path', async (_, defaultName) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName || 'output.mp3',
      filters: [{ name: 'MP3 Audio', extensions: ['mp3'] }]
    })
    if (result.canceled || !result.filePath) return null
    return result.filePath
  })

  // 5. Call OpenAI Whisper API (tự chia khúc khi audio >24MB — video dài không giảm chất lượng)
  const transcribeOnce = async (
    apiKey: string,
    baseUrl: string | undefined,
    filePath: string,
    language?: string,
    prompt?: string
  ): Promise<{
    text: string
    words: { word: string; start: number; end: number }[]
    segments: { start: number; end: number; text: string }[]
  }> => {
    const buffer = await fs.readFile(filePath)
    const file = new File([buffer], path.basename(filePath), { type: 'audio/mp3' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('model', 'whisper-1')
    // verbose_json + word granularity: mốc thời gian từng từ để phụ đề khớp lời nói.
    // Whisper tính phí theo phút audio nên không tăng chi phí.
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')
    formData.append('timestamp_granularities[]', 'segment')
    if (language) formData.append('language', language)
    if (prompt) formData.append('prompt', prompt)

    const url = `${baseUrl || 'https://api.openai.com/v1'}/audio/transcriptions`
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData
    })

    if (!response.ok) {
      const arrayBuf = await response.arrayBuffer()
      const errText = new TextDecoder('utf-8').decode(arrayBuf)
      throw new Error(`Whisper API error: ${response.status} - ${errText}`)
    }

    const json = JSON.parse(new TextDecoder('utf-8').decode(await response.arrayBuffer()))
    return {
      text: json.text || '',
      words: Array.isArray(json.words) ? json.words : [],
      segments: Array.isArray(json.segments)
        ? json.segments.map((s: { start: number; end: number; text: string }) => ({
            start: s.start,
            end: s.end,
            text: s.text
          }))
        : []
    }
  }

  // Handle: Check local Whisper environment
  ipcMain.handle('check-local-whisper', async () => {
    return await checkPythonEnvironment()
  })

  // Handle: Check if model is downloaded
  ipcMain.handle('check-whisper-model', async (_, modelName) => {
    return await isModelDownloaded(modelName || 'medium')
  })

  // Handle: Local Whisper transcription (NEW)
  ipcMain.handle('call-local-whisper', async (event, { audioPath, language, model }) => {
    try {
      const result = await transcribeWithLocalWhisper(
        audioPath,
        language || 'auto',
        model || 'medium',
        (message) => {
          // Send progress to renderer
          event.sender.send('whisper-progress', { message })
        }
      )
      return result
    } catch (error: any) {
      throw new Error(`Local Whisper failed: ${error.message}`)
    }
  })

  // Handle: OpenAI Whisper API (LEGACY - keep for backward compatibility)
  ipcMain.handle('call-whisper-api', async (event, { apiKey, baseUrl, audioPath, language, prompt }) => {
    const MAX_WHISPER_BYTES = 24 * 1024 * 1024
    const CHUNK_SECONDS = 480 // 8 phút/khúc
    const OVERLAP_SECONDS = 5
    const stats = await fs.stat(audioPath)

    assertFfmpegAvailable()
    const totalDuration = await getVideoDuration(audioPath)

    // Chia khúc khi vượt NGƯỠNG DUNG LƯỢNG **hoặc** NGƯỠNG THỜI LƯỢNG.
    // Bằng chứng (spec 06, đo thật bằng Whisper API với audio 15 phút nội dung đa dạng):
    // gọi nguyên khối 1 lần thiếu 15/205 câu (7.3%, có cụm liền 6 câu); chia khúc ~7.5 phút
    // chỉ còn thiếu 2/205 câu (~1%). Video 10-20 phút chỉ ~5-10MB (dưới xa ngưỡng 24MB) nên
    // trước đây KHÔNG hề được chia khúc — đây là nguyên nhân thực sự của "sub bị thiếu".
    const needsChunking = stats.size > MAX_WHISPER_BYTES || (totalDuration > 0 && totalDuration > CHUNK_SECONDS)

    if (!needsChunking) {
      return transcribeOnce(apiKey, baseUrl, audioPath, language, prompt)
    }
    if (totalDuration <= 0) {
      throw new Error('Không đọc được thời lượng audio để chia khúc.')
    }
    // Cắt cứng tại mốc cố định có thể rơi GIỮA câu nói → mất chữ, nghe sai.
    // Giải pháp: các khúc CHỒNG LẤN nhau 5s; khi ghép chỉ giữ nội dung thuộc "vùng sở
    // hữu" của mỗi khúc — câu vắt qua ranh giới luôn được một khúc nghe TRỌN VẸN.
    // (Không dùng dò-im-lặng vì video nhạc nền liên tục không có khoảng lặng để cắt.)
    const numChunks = Math.ceil(totalDuration / CHUNK_SECONDS)
    console.log(`[whisper] Audio ${(stats.size / 1024 / 1024).toFixed(1)}MB, ${totalDuration.toFixed(0)}s — chia ${numChunks} khúc x ${CHUNK_SECONDS}s (chồng lấn ${OVERLAP_SECONDS}s)`)

    const merged = {
      text: '',
      words: [] as { word: string; start: number; end: number }[],
      segments: [] as { start: number; end: number; text: string }[]
    }
    const chunkDir = path.join(app.getPath('temp'), `whisper_chunks_${Date.now()}`)
    await fs.mkdir(chunkDir, { recursive: true })

    try {
      for (let i = 0; i < numChunks; i++) {
        // Vùng sở hữu của khúc i: [ownStart, ownEnd). Audio thực tế cắt rộng hơn
        // (thêm overlap 2 phía) để câu vắt ranh giới được nghe trọn trong một khúc.
        const ownStart = i * CHUNK_SECONDS
        const ownEnd = Math.min((i + 1) * CHUNK_SECONDS, totalDuration)
        const audioStart = Math.max(0, ownStart - (i > 0 ? OVERLAP_SECONDS : 0))
        const audioEnd = Math.min(totalDuration, ownEnd + (i < numChunks - 1 ? OVERLAP_SECONDS : 0))
        const chunkPath = path.join(chunkDir, `chunk_${i}.mp3`)
        await new Promise<void>((resolve, reject) => {
          // -c copy: cắt theo frame MP3, nhanh và không tái nén (không giảm chất lượng)
          const ff = spawn(ffmpegPath, [
            '-ss', audioStart.toFixed(3),
            '-t', (audioEnd - audioStart).toFixed(3),
            '-i', audioPath,
            '-c', 'copy',
            chunkPath,
            '-y'
          ])
          ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg chia khúc lỗi (code ${code})`))))
          ff.on('error', reject)
        })

        const part = await transcribeOnce(apiKey, baseUrl, chunkPath, language, prompt)
        // Chỉ giữ nội dung bắt đầu trong vùng sở hữu — phần trong overlap thuộc khúc kia,
        // tránh trùng lặp câu ở vùng chồng lấn
        for (const w of part.words) {
          const gs = w.start + audioStart
          if (gs >= ownStart && gs < ownEnd) {
            merged.words.push({ word: w.word, start: gs, end: w.end + audioStart })
          }
        }
        for (const s of part.segments) {
          const gs = s.start + audioStart
          if (gs >= ownStart - 0.2 && gs < ownEnd) {
            merged.segments.push({ start: gs, end: s.end + audioStart, text: s.text })
            merged.text += (merged.text ? ' ' : '') + s.text.trim()
          }
        }
        event.sender.send('ffmpeg-progress', {
          type: 'whisper-chunks',
          percent: Math.round(((i + 1) / numChunks) * 100)
        })
      }
    } finally {
      await fs.rm(chunkDir, { recursive: true, force: true }).catch(() => {})
    }

    return merged
  })

  // 6. Call OpenAI GPT API for Translation
  ipcMain.handle('call-gpt-api', async (_, { apiKey, baseUrl, model, messages }) => {
    const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const arrayBuf = await response.arrayBuffer()
      const errText = new TextDecoder('utf-8').decode(arrayBuf)
      throw new Error(`GPT API error: ${response.status} - ${errText}`)
    }

    const arrayBuf = await response.arrayBuffer()
    const responseText = new TextDecoder('utf-8').decode(arrayBuf)
    const json: any = JSON.parse(responseText)
    return json.choices[0].message.content
  })

  // 7. Preview TTS Voice with caching
  ipcMain.handle('preview-tts-voice', async (_, voice, apiKey, baseUrl, elevenLabsApiKey, speed) => {
    try {
      const previewText = 'Xin chào, đây là giọng thuyết minh tiếng Việt thử nghiệm.'
      const { filePath } = await getOrSynthesizeTts(previewText, voice, {
        apiKey,
        baseUrl,
        elevenLabsApiKey,
        speed
      })
      return `media://local/${filePath}`
    } catch (err: any) {
      console.error('[TTS Preview] Error generating preview voice:', err)
      throw new Error(`Failed to generate TTS preview: ${err.message}`)
    }
  })

  // 7b. Get TTS Audio with MD5 cache
  ipcMain.handle('get-tts-audio', async (_, { text, voice, apiKey, baseUrl, elevenLabsApiKey, speed }) => {
    try {
      const { filePath, fromCache } = await getOrSynthesizeTts(text, voice, {
        apiKey,
        baseUrl,
        elevenLabsApiKey,
        speed
      })
      console.log(`[get-tts-audio] ${fromCache ? 'Cache hit' : 'Generated'}: "${text.substring(0, 30)}..."`)
      return `media://local/${filePath}`
    } catch (err: any) {
      console.error('[Get TTS Audio Error]:', err)
      throw new Error(`Failed to get TTS audio: ${err.message}`)
    }
  })

  // 12. Extract Embedded Subtitles from Video using FFmpeg
  ipcMain.handle('extract-embedded-subtitles', async (_, videoPath) => {
    assertFfmpegAvailable()
    const tempSrtPath = videoPath.substring(0, videoPath.lastIndexOf('.')) + `_extracted_subs_${Date.now()}.srt`
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath, [
        '-i',
        videoPath,
        '-map',
        '0:s:0',
        '-f',
        'srt',
        tempSrtPath,
        '-y'
      ])

      ffmpeg.on('close', async (code) => {
        if (code === 0) {
          try {
            const content = await fs.readFile(tempSrtPath, 'utf-8')
            await fs.unlink(tempSrtPath).catch(() => {})
            resolve(content)
          } catch (err: any) {
            reject(new Error(`Không thể đọc file phụ đề trích xuất: ${err.message}`))
          }
        } else {
          await fs.unlink(tempSrtPath).catch(() => {})
          reject(new Error('Video không có phụ đề nhúng (subtitle stream) tương thích hoặc trích xuất thất bại.'))
        }
      })

      ffmpeg.on('error', async (err) => {
        await fs.unlink(tempSrtPath).catch(() => {})
        reject(new Error(`Lỗi khởi động FFmpeg: ${err.message}`))
      })
    })
  })

  // 13. Reverse Video (Phát ngược)
  ipcMain.handle('reverse-video', async (event, videoPath, outputPath) => {
    assertFfmpegAvailable()
    const outputDir = path.dirname(outputPath)
    return new Promise((resolve, reject) => {
      // ffmpeg -i input.mp4 -vf reverse -af areverse -preset superfast output.mp4
      const ffmpegArgs = [
        '-i', videoPath,
        '-vf', 'reverse',
        '-af', 'areverse',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        outputPath,
        '-y'
      ]

      const ffmpeg = spawn(ffmpegPath, ffmpegArgs, { cwd: outputDir })
      
      let duration = 0
      ffmpeg.stderr.on('data', (data) => {
        const text = data.toString()
        const durMatch = text.match(/Duration:\s*(\d{2}:\d{2}:\d{2}\.\d{2})/)
        if (durMatch) {
          duration = durationToSeconds(durMatch[1])
        }
        const timeMatch = text.match(/time=\s*(\d{2}:\d{2}:\d{2}\.\d{2})/)
        if (timeMatch && duration > 0) {
          const time = durationToSeconds(timeMatch[1])
          const percent = Math.min(99, Math.round((time / duration) * 100))
          event.sender.send('ffmpeg-progress', { type: 'reverse-video', percent })
        }
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          event.sender.send('ffmpeg-progress', { type: 'reverse-video', percent: 100 })
          resolve(true)
        } else {
          reject(new Error(`FFmpeg reverse exited with code ${code}`))
        }
      })

      ffmpeg.on('error', (err) => {
        reject(err)
      })
    })
  })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // Register media custom protocol handler for local video streaming with HTTP Range support
  protocol.handle('media', async (request) => {
    try {
      console.log('[Media Protocol] Raw Request URL:', request.url)
      
      // Extract the path after media://local/
      let rawPath = request.url.replace(/^media:\/\/local\//i, '')
      let filePath = decodeURIComponent(rawPath)
      filePath = path.normalize(filePath)
      
      const fileStats = await fs.stat(filePath)
      const ext = path.extname(filePath).toLowerCase()
      let mimeType = 'application/octet-stream'
      if (ext === '.mp4') mimeType = 'video/mp4'
      else if (ext === '.mkv') mimeType = 'video/x-matroska'
      else if (ext === '.avi') mimeType = 'video/x-msvideo'
      else if (ext === '.mov') mimeType = 'video/quicktime'
      else if (ext === '.webm') mimeType = 'video/webm'
      else if (ext === '.mp3') mimeType = 'audio/mpeg'
      else if (ext === '.wav') mimeType = 'audio/wav'

      const rangeHeader = request.headers.get('range')
      if (!rangeHeader) {
        const stream = createReadStream(filePath)
        stream.on('error', (err) => {
          console.warn('[Media Protocol Stream Error]:', err.message)
        })
        return new Response(stream as any, {
          headers: {
            'Content-Type': mimeType,
            'Accept-Ranges': 'bytes',
            'Content-Length': fileStats.size.toString()
          }
        })
      }

      // Parse Range header (e.g. "bytes=0-1000" or "bytes=0-")
      const parts = rangeHeader.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileStats.size - 1
      const chunksize = end - start + 1

      const stream = createReadStream(filePath, { start, end })
      stream.on('error', (err) => {
        console.warn('[Media Protocol Stream Range Error]:', err.message)
      })
      return new Response(stream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileStats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': mimeType
        }
      })
    } catch (err) {
      console.error('[Media Protocol] Error resolving path:', err)
      return new Response('Error loading media', { status: 500 })
    }
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Prevent uncaught stream errors from causing fatal JS dialog popups
process.on('uncaughtException', (error) => {
  console.error('[Main Process Uncaught Exception]:', error)
})
process.on('unhandledRejection', (reason) => {
  console.error('[Main Process Unhandled Rejection]:', reason)
})
