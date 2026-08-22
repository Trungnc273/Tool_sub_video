# 🎙️ Local Whisper Integration for Sub 4.0

## 📋 Tổng quan

Sub 4.0 đã được nâng cấp để sử dụng **Local Whisper STT** thay vì OpenAI Whisper API:

### ✅ Ưu điểm
- **Không cần OpenAI API key** (miễn phí hoàn toàn)
- **Không giới hạn thời lượng** (API giới hạn 25MB/file)
- **Bảo mật** (audio không upload lên cloud)
- **Offline** (chạy được không cần internet sau khi download model)

### 📦 Kiến trúc

```
Sub 4.0 (Electron)
    ↓ IPC call
Main Process (Node.js)
    ↓ spawn Python
whisper_transcribe.py
    ↓ faster-whisper
Local Whisper Model
    ↓ JSON result
Main Process
    ↓ IPC response
Renderer Process (UI)
```

---

## 🚀 Development Setup

### 1. Cài đặt Python 3.10+
```bash
# Download từ: https://www.python.org/downloads/
# Hoặc dùng: winget install Python.Python.3.11
```

### 2. Cài đặt Python dependencies
```bash
cd python_modules
pip install -r requirements.txt
```

**Lưu ý**: CUDA packages có thể fail trên máy không có GPU NVIDIA. Điều này OK - Whisper sẽ tự động chạy ở CPU mode.

### 3. Test Python script standalone
```bash
cd python_modules
python whisper_transcribe.py "path/to/test_audio.mp3" --language vi --model medium
```

### 4. Run Sub 4.0 dev mode
```bash
npm run dev
```

---

## 🏗️ Production Build

### Build Steps

```bash
# 1. Prepare Python embedded package
npm run prepare:python

# Kết quả:
# ✓ Download Python 3.11.9 embedded (~30MB)
# ✓ Extract to resources/python/
# ✓ Install pip
# ✓ Install faster-whisper dependencies
# ✓ Copy python_modules/ scripts

# 2. Build app với Python bundle
npm run build:win

# Kết quả:
# ✓ Sub4.0-1.3.0-setup.exe (~600-800MB)
```

### Kích thước installer

```
Installer size: ~600-800MB
├── Electron app: ~200MB
├── Python embedded: ~50MB
├── Python packages: ~300MB
│   ├── faster-whisper: ~50MB
│   ├── CUDA libs: ~500MB (optional, for GPU)
│   └── numpy, ctranslate2: ~200MB
└── FFmpeg: ~50MB

Model downloaded on first run:
└── medium model: ~1.5GB (cached to %USERPROFILE%\.cache\)
```

### User Experience

```
1. User download: Sub4.0-1.3.0-setup.exe (600MB)
   ↓
2. Run installer: NSIS auto-install (1-2 phút)
   ├── Extract to Program Files
   ├── Create shortcuts
   └── Done!
   ↓
3. First launch:
   ├── Check model downloaded? No
   ├── Download progress: "Đang tải Whisper model... 15%"
   ├── Model saved to cache (1.5GB)
   └── Ready! (5-10 phút)
   ↓
4. Subsequent launches: Instant! ⚡
```

---

## 🔧 API Usage

### Check Environment
```typescript
const { ready, error } = await ipcRenderer.invoke('check-local-whisper')
if (!ready) {
  console.error('Python not ready:', error)
}
```

### Check Model Downloaded
```typescript
const downloaded = await ipcRenderer.invoke('check-whisper-model', 'medium')
if (!downloaded) {
  // Show download UI
}
```

### Transcribe Audio
```typescript
try {
  const result = await ipcRenderer.invoke('call-local-whisper', {
    audioPath: 'path/to/audio.mp3',
    language: 'vi', // or 'auto', 'en', 'zh', etc
    model: 'medium' // or 'tiny', 'base', 'small', 'large-v3'
  })
  
  console.log('Transcript:', result.text)
  console.log('Segments:', result.segments)
  console.log('Words:', result.words)
} catch (error) {
  console.error('Transcription failed:', error)
}
```

### Listen to Progress
```typescript
ipcRenderer.on('whisper-progress', (_, { message }) => {
  console.log(message)
  // Update UI: "Đang phiên âm... 45%"
})
```

---

## 📊 Model Comparison

| Model | Size | Speed | Quality | Khuyến nghị |
|-------|------|-------|---------|-------------|
| tiny | 75MB | Rất nhanh | Thấp | Test only |
| base | 145MB | Nhanh | Trung bình | Subtitle đơn giản |
| small | 466MB | Khá nhanh | Tốt | Cân bằng tốt |
| **medium** | **1.5GB** | **Vừa** | **Rất tốt** | **⭐ Khuyến nghị** |
| large-v3 | 3GB | Chậm | Xuất sắc | Professional |

### Performance (Core i5, 16GB RAM)

| Model | CPU time (10 min video) | GPU time (RTX 3060) |
|-------|-------------------------|---------------------|
| tiny | ~3 phút | ~30 giây |
| medium | ~8 phút | ~1 phút |
| large-v3 | ~15 phút | ~2 phút |

---

## 🐛 Troubleshooting

### Python not found
```
Error: Python not found at: C:\Program Files\vietsub-pro\resources\python\python.exe

Fix:
- Development: Install Python 3.10+ system-wide
- Production: Run prepare-python script trước khi build
```

### faster-whisper not installed
```
Error: faster-whisper not installed

Fix:
cd python_modules
pip install -r requirements.txt
```

### Model download failed
```
Error: Failed to download model

Fix:
- Check internet connection
- Clear cache: del /s %USERPROFILE%\.cache\huggingface\
- Retry transcription (auto re-download)
```

### CUDA errors (GPU)
```
Warning: CUDA not available, falling back to CPU

OK - Whisper tự động chuyển sang CPU mode. Chậm hơn nhưng vẫn hoạt động.

Để enable GPU:
- Cài NVIDIA driver mới nhất
- Đảm bảo có GPU CUDA-compatible (GTX/RTX series)
```

---

## 🔄 Migration từ OpenAI API

### Code cũ (OpenAI API)
```typescript
const result = await ipcRenderer.invoke('call-whisper-api', {
  apiKey: 'sk-xxx',
  baseUrl: 'https://api.openai.com/v1',
  audioPath: 'audio.mp3',
  language: 'vi'
})
```

### Code mới (Local Whisper)
```typescript
const result = await ipcRenderer.invoke('call-local-whisper', {
  audioPath: 'audio.mp3',
  language: 'vi',
  model: 'medium'
})
```

**Backward compatibility**: Code cũ vẫn hoạt động, nhưng sẽ hiện warning khuyến nghị dùng local Whisper.

---

## 📈 Roadmap

### ✅ Phase 1 (Completed)
- [x] Python script integration
- [x] IPC handlers
- [x] Model management
- [x] Build scripts

### 🔄 Phase 2 (Current)
- [ ] UI cho model download progress
- [ ] Settings để chọn model size
- [ ] Cache management UI

### 🎯 Phase 3 (Future)
- [ ] Model quantization (giảm size)
- [ ] Batch processing (nhiều video cùng lúc)
- [ ] Custom model support
- [ ] Cloud sync settings

---

## 📚 References

- [faster-whisper GitHub](https://github.com/SYSTRAN/faster-whisper)
- [Whisper Models](https://github.com/openai/whisper#available-models-and-languages)
- [electron-builder Documentation](https://www.electron.build/)

---

## 👨‍💻 Maintainer

- Adapted from: auto_script project
- Integration: Sub 4.0 v1.3.0+
- Date: 2025

---

Có câu hỏi? Tạo issue trên GitHub hoặc liên hệ support.
