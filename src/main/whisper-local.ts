/**
 * Local Whisper STT Integration for Sub 4.0
 * Replaces OpenAI Whisper API with local faster-whisper
 */

import { spawn } from 'child_process'
import path from 'path'
import { app } from 'electron'
import fs from 'fs/promises'

interface WhisperResult {
  text: string
  segments: Array<{
    start: number
    end: number
    text: string
  }>
  words: Array<{
    word: string
    start: number
    end: number
  }>
  language?: string
  duration?: number
  error?: string
}

/**
 * Get Python executable path
 * - Development: Use system Python (py on Windows, python on Unix)
 * - Production: Use embedded Python in resources/python/
 */
function getPythonPath(): string {
  if (app.isPackaged) {
    // Production: embedded Python
    return path.join(process.resourcesPath, 'python', 'python.exe')
  } else {
    // Development: system Python
    // Windows uses 'py' launcher, Unix uses 'python'
    return process.platform === 'win32' ? 'py' : 'python'
  }
}

/**
 * Get whisper_transcribe.py script path
 */
function getWhisperScriptPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python_modules', 'whisper_transcribe.py')
  } else {
    return path.join(__dirname, '..', '..', 'python_modules', 'whisper_transcribe.py')
  }
}

/**
 * Check if Python environment is ready
 */
export async function checkPythonEnvironment(): Promise<{ ready: boolean; error?: string; pythonVersion?: string; hasFasterWhisper?: boolean }> {
  try {
    const pythonPath = getPythonPath()
    const scriptPath = getWhisperScriptPath()

    // Check script exists
    try {
      await fs.access(scriptPath)
    } catch {
      return {
        ready: false,
        error: `Whisper script not found at: ${scriptPath}`
      }
    }

    // Test Python and faster_whisper availability
    return new Promise((resolve) => {
      // For development mode, pythonPath is 'py' or 'python' (command, not file)
      // For production mode, pythonPath is full path to python.exe
      const testProcess = spawn(pythonPath, ['-c', 'import sys; import faster_whisper; print(f"{sys.version.split()[0]}|OK")'])
      let output = ''
      let errorOutput = ''

      testProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      testProcess.on('close', (code) => {
        if (code === 0 && output.includes('OK')) {
          const parts = output.trim().split('|')
          const pythonVersion = parts[0] || 'Unknown'
          resolve({ 
            ready: true,
            pythonVersion,
            hasFasterWhisper: true
          })
        } else {
          resolve({
            ready: false,
            error: errorOutput || 'faster-whisper not installed. Run: pip install faster-whisper'
          })
        }
      })

      testProcess.on('error', (err) => {
        resolve({
          ready: false,
          error: `Python not found. Please install Python 3.11+ from python.org`
        })
      })
    })
  } catch (err: any) {
    return {
      ready: false,
      error: err.message
    }
  }
}

/**
 * Transcribe audio file using local Whisper
 * 
 * @param audioPath - Path to audio/video file
 * @param language - Language code (auto, en, vi, zh, etc)
 * @param modelName - Model size (tiny, base, small, medium, large-v3)
 * @param onProgress - Progress callback (for model download)
 */
export async function transcribeWithLocalWhisper(
  audioPath: string,
  language: string = 'auto',
  modelName: string = 'medium',
  onProgress?: (message: string) => void
): Promise<WhisperResult> {
  const pythonPath = getPythonPath()
  const scriptPath = getWhisperScriptPath()

  return new Promise((resolve, reject) => {
    const args = [
      scriptPath,
      audioPath,
      '--language',
      language,
      '--model',
      modelName
    ]

    onProgress?.(`[Local Whisper] Starting transcription...`)
    onProgress?.(`[Local Whisper] Model: ${modelName}, Language: ${language}`)

    const whisperProcess = spawn(pythonPath, args)

    let stdout = ''
    let stderr = ''

    whisperProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    whisperProcess.stderr.on('data', (data) => {
      const message = data.toString()
      stderr += message
      // Forward progress messages
      if (message.includes('[Whisper]')) {
        onProgress?.(message.trim())
      }
    })

    whisperProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout) as WhisperResult
          if (result.error) {
            reject(new Error(result.error))
          } else {
            onProgress?.(`[Local Whisper] ✓ Complete: ${result.text.length} chars, ${result.segments.length} segments`)
            resolve(result)
          }
        } catch (parseError: any) {
          reject(new Error(`Failed to parse Whisper output: ${parseError.message}\nOutput: ${stdout.slice(0, 500)}`))
        }
      } else {
        reject(new Error(`Whisper process exited with code ${code}\nError: ${stderr}`))
      }
    })

    whisperProcess.on('error', (err) => {
      reject(new Error(`Failed to start Whisper process: ${err.message}`))
    })
  })
}

/**
 * Check if Whisper model is downloaded
 */
export async function isModelDownloaded(modelName: string = 'medium'): Promise<boolean> {
  const cacheDir = path.join(
    process.env.USERPROFILE || process.env.HOME || '',
    '.cache',
    'huggingface',
    'hub',
    `models--Systran--faster-whisper-${modelName}`
  )

  try {
    await fs.access(cacheDir)
    const stats = await fs.stat(cacheDir)
    // Check if directory is not empty
    const files = await fs.readdir(cacheDir)
    return files.length > 0
  } catch {
    return false
  }
}

/**
 * Get model cache directory
 */
export function getModelCacheDir(modelName: string = 'medium'): string {
  return path.join(
    process.env.USERPROFILE || process.env.HOME || '',
    '.cache',
    'huggingface',
    'hub',
    `models--Systran--faster-whisper-${modelName}`
  )
}
