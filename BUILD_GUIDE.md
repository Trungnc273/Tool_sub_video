# 🏗️ Sub 4.0 Build Guide - Local Whisper Edition

## 📝 Tổng quan quy trình build

### Development Build (Test nhanh)
```
1. Code Python script ✍️
2. Test standalone (Python CLI) 🧪
3. Integrate vào Electron (IPC) 🔗
4. Test trong dev mode 🚀
```

### Production Build (Phát hành)
```
1. Prepare Python embedded 📦
2. Build Electron app 🔨
3. NSIS tạo installer 📥
4. Test trên máy sạch ✅
```

---

## 🚀 PHASE 1: Development Setup (30 phút)

### Bước 1: Kiểm tra môi trường

```bash
# Check Node.js
node --version  # Cần >= 18.0.0

# Check Python
python --version  # Cần >= 3.10.0

# Check npm
npm --version
```

### Bước 2: Install dependencies

```bash
cd "d:\PRJ-2026\giang\sub 4.0"

# Install Node.js packages
npm install

# Install Python packages
cd python_modules
pip install -r requirements.txt

# ⚠️ Nếu CUDA packages fail → OK!
#    Whisper sẽ tự động dùng CPU mode
```

### Bước 3: Test Python script riêng

```bash
cd python_modules

# Test với audio mẫu (nếu có)
python whisper_transcribe.py "../test_video/sample.mp3" --language vi --model tiny

# Kết quả mong đợi:
# {
#   "text": "transcript here...",
#   "segments": [...],
#   "words": [...]
# }
```

**⏱️ Lần đầu chạy**: Model sẽ tự download (~75MB cho tiny, ~1.5GB cho medium)

### Bước 4: Run Sub 4.0 dev mode

```bash
cd ..
npm run dev
```

**Test trong app:**
1. Mở Settings → Kiểm tra "Local Whisper Status"
2. Import video test
3. Chọn "Use Local Whisper" 
4. Transcribe → Check kết quả

---

## 🏗️ PHASE 2: Production Build (2-3 giờ)

### Bước 1: Prepare Python Embedded

```bash
# Script tự động download & setup Python
npm run prepare:python
```

**Script sẽ làm gì:**
```
📥 Download Python 3.11.9 embedded (~30MB)
   Progress: 100% (28.5MB)
   ✓ Download complete!

📦 Extracting Python...
   ✓ Extraction complete!

🔧 Configuring Python for pip...
   ✓ Python configured for pip

📦 Installing pip...
   ✓ pip installed!

📦 Installing Python dependencies...
   Collecting faster-whisper>=1.2.0
   Downloading faster_whisper-1.2.0-py3-none-any.whl (45 kB)
   ...
   ✓ Dependencies installed!

📁 Copying python_modules...
   ✓ whisper_transcribe.py
   ✓ requirements.txt
   ✓ README.md
   ✓ python_modules copied!

✅ Python embedded package ready!
📂 Location: d:\PRJ-2026\giang\sub 4.0\resources\python

🚀 You can now run: npm run build:win
```

**Kích thước sau prepare:**
```
resources/
├── python/  (~400MB)
│   ├── python.exe
│   ├── python311.dll
│   ├── Lib/
│   └── Scripts/pip.exe
└── python_modules/  (~50KB)
    ├── whisper_transcribe.py
    └── requirements.txt
```

### Bước 2: Build Electron App

```bash
npm run build:win
```

**Build process:**
```
✓ TypeScript compilation
✓ Vite bundle renderer
✓ electron-vite build main/preload
✓ electron-builder packaging

Building:
  • electron-builder  version=26.0.12
  • loaded configuration  file=electron-builder.yml
  • packaging         platform=win32 arch=x64 electron=39.8.10
  • building          target=nsis file=Sub4.0-1.3.0-setup.exe
  • building block map  blockMapFile=Sub4.0-1.3.0-setup.exe.blockmap

✓ Built: dist/Sub4.0-1.3.0-setup.exe
  Size: 687 MB
  BlockMap: Sub4.0-1.3.0-setup.exe.blockmap
```

**Output:**
```
dist/
├── Sub4.0-1.3.0-setup.exe        (~687MB) ⭐ INSTALLER
├── Sub4.0-1.3.0-setup.exe.blockmap
├── win-unpacked/                  (extracted app)
│   ├── vietsub-pro.exe
│   ├── resources/
│   │   ├── app.asar
│   │   ├── python/               (Python embedded)
│   │   └── python_modules/
│   └── ...
└── builder-effective-config.yaml
```

### Bước 3: Test installer

**Trên máy dev (đã có Python):**
```bash
# Run installer
dist/Sub4.0-1.3.0-setup.exe

# Install to: C:\Program Files\vietsub-pro\
# Launch app → Test transcription
```

**Trên máy sạch (không có Python):**
```bash
# Copy installer to máy test
# Run installer → Check Python embedded works
# Test transcription → Verify model download
```

---

## 📊 Kích thước & Performance

### Development Mode
```
Resources in memory:
├── Node.js: ~50MB
├── Electron: ~100MB
├── App code: ~10MB
└── Python process: ~500MB (khi transcribe)

Total: ~660MB RAM
```

### Production Installer
```
Sub4.0-1.3.0-setup.exe: ~687MB

After installation:
C:\Program Files\vietsub-pro\
├── App files: ~200MB
├── Python embedded: ~400MB
└── Total: ~600MB disk

First run download:
%USERPROFILE%\.cache\huggingface\
└── whisper model: ~1.5GB (medium)

Total after setup: ~2.1GB
```

### Comparison với app khác
```
✅ Sub 4.0:        687MB installer → 2.1GB installed
   Discord:        150MB installer → 300MB installed
   OBS Studio:     120MB installer → 500MB installed
   DaVinci Resolve: 3.5GB installer → 10GB installed
   Adobe Premiere: 2GB installer → 8GB installed

→ Sub 4.0 size HỢP LÝ cho AI-powered app
```

---

## 🎯 Optimization Tips

### Giảm installer size

#### 1. Không bundle model (⭐ RECOMMENDED)
```yaml
# electron-builder.yml
# Để model tự download lần đầu chạy
# Giảm: 687MB → 687MB (không đổi, model không trong installer)
```

#### 2. Dùng model nhỏ hơn làm default
```typescript
// whisper-local.ts
const DEFAULT_MODEL = 'small'  // ~466MB thay vì medium ~1.5GB

// User vẫn chọn được medium/large trong Settings
```

#### 3. Loại bỏ CUDA libs (CPU only)
```txt
# requirements.txt
faster-whisper>=1.2.0
# nvidia-cublas-cu12>=12.0  ← Comment out
# nvidia-cudnn-cu12>=9.0     ← Comment out

# Giảm: 687MB → ~400MB
# Trade-off: Không dùng được GPU
```

#### 4. PyInstaller onefile (Alternative approach)
```bash
# Build Python thành 1 file .exe
pyinstaller --onefile whisper_transcribe.py

# Giảm: 687MB → ~500MB
# Trade-off: Khó debug hơn
```

### Tăng performance

#### 1. Preload model khi app start
```typescript
// main/index.ts
app.on('ready', async () => {
  // Preload model in background
  checkPythonEnvironment()
  isModelDownloaded('medium')
})
```

#### 2. Keep Python process alive
```typescript
// Thay vì spawn mỗi lần, giữ 1 Python server chạy nền
const pythonServer = spawn(pythonPath, ['whisper_server.py'])
// Giao tiếp qua stdin/stdout
```

#### 3. Model quantization
```python
# Dùng int8 quantized model
model = WhisperModel("medium", compute_type="int8")
# Giảm: 1.5GB → ~500MB, chậm hơn ~20%
```

---

## 🐛 Common Issues

### Issue 1: Python script not found
```
Error: ENOENT: no such file or directory
  at whisper_transcribe.py

Fix:
- Check resources/python_modules/ exists
- Re-run: npm run prepare:python
```

### Issue 2: Module 'faster_whisper' not found
```
ModuleNotFoundError: No module named 'faster_whisper'

Fix:
cd resources/python
Scripts\pip.exe install faster-whisper
```

### Issue 3: NSIS build failed
```
Error: building  nsis file=Sub4.0-setup.exe failed

Fix:
- Check disk space (cần ~5GB free)
- Check antivirus không block
- Disable Windows Defender tạm thời
```

### Issue 4: Installer quá lớn (>1GB)
```
Check:
- node_modules có bị bundle? (xem electron-builder.yml files exclude)
- Python site-packages có thừa packages?
- lucide-react bị bundle? (đã exclude trong config)
```

---

## ✅ Pre-release Checklist

### Code
- [ ] All TypeScript compiled without errors
- [ ] Python script tested standalone
- [ ] IPC handlers tested in dev mode
- [ ] Error handling cho tất cả edge cases

### Build
- [ ] prepare-python.js chạy thành công
- [ ] electron-builder không có warnings
- [ ] Installer size < 800MB
- [ ] File structure đúng trong win-unpacked/

### Testing
- [ ] Install trên máy dev → OK
- [ ] Install trên máy sạch (no Python) → OK
- [ ] Transcribe video ngắn (2 min) → OK
- [ ] Transcribe video dài (15 min) → OK
- [ ] Check model auto-download → OK
- [ ] Check progress UI → OK
- [ ] Uninstall clean → OK

### Documentation
- [ ] WHISPER_INTEGRATION.md updated
- [ ] README.md updated với local Whisper info
- [ ] CHANGELOG.md added entry
- [ ] GitHub release notes prepared

---

## 🚀 Release Process

### 1. Version bump
```bash
# Update version in package.json
npm version patch  # 1.2.2 → 1.2.3
# or
npm version minor  # 1.2.2 → 1.3.0
```

### 2. Build release
```bash
npm run prepare:python
npm run build:win
```

### 3. Test installer thoroughly
```bash
# Test matrix:
- Windows 10 x64 ✓
- Windows 11 x64 ✓
- Máy có GPU NVIDIA ✓
- Máy không GPU (CPU only) ✓
- Máy low RAM (8GB) ✓
```

### 4. Upload to GitHub Releases
```bash
# Tag version
git tag v1.3.0
git push origin v1.3.0

# Upload file:
# - Sub4.0-1.3.0-setup.exe
# - Release notes
```

### 5. Announce
```
📢 Sub 4.0 v1.3.0 Released!

✨ New: Local Whisper STT
- Không cần OpenAI API key
- Unlimited transcription
- 100% privacy (offline)

Download: [link]
```

---

## 📚 References

- [Electron Builder Docs](https://www.electron.build/)
- [NSIS Installer](https://nsis.sourceforge.io/)
- [Python Embeddable Package](https://www.python.org/downloads/windows/)
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper)

---

**Last updated**: 2025
**Maintainer**: Sub 4.0 Team
