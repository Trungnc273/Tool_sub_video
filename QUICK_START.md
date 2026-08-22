# ⚡ Quick Start - Test Local Whisper NGAY

## 🚀 Test trong 5 phút

### Bước 1: Cài Python packages
```bash
cd "d:\PRJ-2026\giang\sub 4.0\python_modules"
pip install -r requirements.txt
```

**⏱️ Thời gian**: 2-3 phút
**⚠️ Lưu ý**: CUDA packages có thể fail → OK, sẽ dùng CPU mode

### Bước 2: Test Python script standalone
```bash
# Tạo file audio test (hoặc dùng có sẵn)
cd ..
python python_modules\whisper_transcribe.py "test_video\sample.mp3" --language vi --model tiny
```

**Kết quả mong đợi**:
```json
{
  "text": "Transcript của audio...",
  "segments": [...],
  "words": [...],
  "language": "vi"
}
```

**⏱️ Lần đầu**: Model sẽ tự download (~75MB cho tiny)

### Bước 3: Run Sub 4.0 dev mode
```bash
npm run dev
```

**Test trong app**:
1. Settings → Check "Local Whisper Status"
2. Import video test
3. Transcribe với Local Whisper
4. Kiểm tra kết quả

---

## 🏗️ Build Production (1 giờ)

### Bước 1: Prepare Python
```bash
npm run prepare:python
```

**⏱️ Thời gian**: 10-15 phút (download + install)

### Bước 2: Build installer
```bash
npm run build:win
```

**⏱️ Thời gian**: 5-10 phút

**Output**: `dist\Sub4.0-1.3.0-setup.exe` (~687MB)

### Bước 3: Test installer
```bash
# Run installer
dist\Sub4.0-1.3.0-setup.exe

# Test transcription trong installed app
```

---

## ❓ Troubleshooting

### Python not found
```bash
# Install Python 3.10+
winget install Python.Python.3.11
```

### pip install failed
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Retry
cd python_modules
pip install -r requirements.txt
```

### Model download slow
```bash
# Check internet connection
# Model cache: %USERPROFILE%\.cache\huggingface\
```

---

## 📚 Đọc thêm

- [WHISPER_INTEGRATION.md](./WHISPER_INTEGRATION.md) - Chi tiết kỹ thuật
- [BUILD_GUIDE.md](./BUILD_GUIDE.md) - Hướng dẫn build đầy đủ
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Tổng quan implementation

---

**Cần help?** Check documentation hoặc tạo issue!
