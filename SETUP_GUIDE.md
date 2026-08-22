# 🚀 Hướng dẫn Setup Sub 4.0 từ đầu

> **Mục tiêu**: Clone project từ Git → Cài đặt → Chạy thành công với Local Whisper

---

## 📋 Yêu cầu hệ thống

### Phần mềm bắt buộc:
- ✅ **Node.js** 18.x hoặc 20.x ([download](https://nodejs.org/))
- ✅ **Git** ([download](https://git-scm.com/))
- ✅ **Python** 3.11+ ([download](https://www.python.org/downloads/))
- ✅ **Visual Studio Code** (khuyên dùng) ([download](https://code.visualstudio.com/))

### Hệ điều hành:
- Windows 10/11 (64-bit)
- macOS (chưa test)
- Linux (chưa test)

---

## 🔧 Bước 1: Clone Repository

```bash
# Clone về máy
git clone <URL_REPO_CUA_BAN>
cd "sub 4.0"
```

Hoặc nếu đã có sẵn, pull code mới nhất:

```bash
cd "sub 4.0"
git pull origin main
```

---

## 📦 Bước 2: Cài đặt Dependencies

### 2.1 Cài Node.js dependencies

```bash
npm install
```

**Lưu ý**: Nếu gặp lỗi `node-gyp`, cài Visual Studio Build Tools:
```bash
npm install --global windows-build-tools
```

### 2.2 Cài Python dependencies

```bash
# Kiểm tra Python đã cài chưa
python --version
# hoặc
py --version

# Cài faster-whisper
pip install faster-whisper
# hoặc
py -m pip install faster-whisper
```

**Lưu ý Windows**: Nếu lệnh `python` không có, dùng `py` thay thế.

---

## 🎯 Bước 3: Cấu hình môi trường

### 3.1 Tạo file `.env` (nếu chưa có)

Tạo file `.env` ở thư mục gốc với nội dung:

```env
# === AI API Keys ===
DEEPSEEK_API_KEY=sk-0gD11a3Jc7SzGoU6EKVdxPxKfEOWLtHry5TlrluUyBK7iXZY
DEEPSEEK_BASE_URL=https://api.ai-box.vn/v1
DEEPSEEK_MODEL=deepseek-v4-flash

# === ElevenLabs TTS (Optional) ===
ELEVENLABS_API_KEY=your_key_here
```

**Lưu ý**: File `.env` đã được thêm vào `.gitignore` nên không bị push lên Git.

### 3.2 Kiểm tra cấu trúc thư mục

Đảm bảo có các folder sau:

```
sub 4.0/
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   └── whisper-local.ts        ← NEW
│   ├── preload/
│   └── renderer/
├── python_modules/                  ← NEW
│   ├── whisper_transcribe.py
│   ├── requirements.txt
│   └── README.md
├── scripts/                         ← NEW
│   └── prepare-python.js
├── package.json
├── electron-builder.yml
└── .env
```

---

## ▶️ Bước 4: Chạy Development Mode

```bash
npm run dev
```

**Kết quả mong đợi:**
```
✓ electron main process built successfully
✓ electron preload scripts built successfully
dev server running for the electron renderer process at:
  ➜  Local:   http://localhost:5173/
starting electron app...
```

App Electron sẽ tự động mở.

---

## 🧪 Bước 5: Test Local Whisper

### 5.1 Kiểm tra Settings

1. Mở app → Click **Cài đặt** (góc trên)
2. Kéo xuống phần **"Cấu hình Whisper STT"**
3. Kiểm tra indicator:
   - ✅ **Màu xanh**: "✅ Sẵn sàng - Python 3.x.x" → OK
   - ❌ **Màu đỏ**: "❌ Chưa cài đặt Python hoặc faster-whisper" → Quay lại Bước 2.2

### 5.2 Test với video mẫu

1. Click **"Thêm dự án"**
2. Chọn một video ngắn (~1-2 phút, tiếng Trung/Anh/Việt)
3. Click **"Công cụ AI"**
4. Chọn ngôn ngữ: Trung / Anh / Việt / Tự động
5. Click **"Chạy ASR"**

**Lần đầu chạy:**
- ⏳ Model Whisper sẽ tự động tải (~1.5GB cho model `medium`)
- ⏱️ Thời gian: 2-5 phút (tùy tốc độ mạng)
- 💾 Lưu vào: `C:\Users\<user>\.cache\huggingface\hub\`

**Lần sau:**
- ⚡ Chạy ngay (model đã cache)
- ⏱️ Thời gian: ~30 giây cho video 2 phút

### 5.3 Kiểm tra kết quả

✅ **Thành công nếu:**
- Alert: "Nhận diện giọng nói hoàn tất!"
- Timeline có các đoạn phụ đề xuất hiện
- Click vào đoạn để xem text

❌ **Lỗi nếu:**
- Alert: "Local Whisper chưa sẵn sàng" → Kiểm tra lại Python
- Alert: "Process exited with code..." → Xem phần Troubleshooting

---

## 🏗️ Bước 6: Build Production (Tùy chọn)

### 6.1 Chuẩn bị Python Embedded (Windows)

```bash
npm run prepare:python
```

**Script này sẽ:**
- Tải Python Embedded 3.11.9 (~25MB)
- Cài đặt `faster-whisper` và dependencies vào embedded Python
- Copy vào `resources/python/`

**Lưu ý**: Lệnh này **chỉ chạy 1 lần** trước khi build.

### 6.2 Build Installer

```bash
# Build cho Windows
npm run build:win

# Hoặc build 64-bit only
npm run build:win -- --x64
```

**Kết quả:**
```
dist/
├── Sub 4.0 Setup 1.2.3.exe    (~150MB)
└── win-unpacked/
```

### 6.3 Test Installer

1. Cài đặt từ file `.exe`
2. Chạy app
3. Test Whisper giống như ở Bước 5

---

## 🐛 Troubleshooting

### Lỗi 1: "Local Whisper chưa sẵn sàng"

**Nguyên nhân**: Python hoặc faster-whisper chưa cài

**Cách fix:**
```bash
# Kiểm tra Python
py --version

# Cài faster-whisper
py -m pip install faster-whisper

# Restart app
```

### Lỗi 2: "Whisper process exited with code -1"

**Nguyên nhân**: Process bị kill giữa chừng hoặc model tải lỗi

**Cách fix:**
```bash
# Xóa cache model bị lỗng
rmdir /s /q "%USERPROFILE%\.cache\huggingface\hub\models--Systran--faster-whisper-medium"

# Chạy lại
```

### Lỗi 3: Model tải quá lâu (>10 phút)

**Nguyên nhân**: Mạng chậm hoặc HuggingFace Hub bị giới hạn rate

**Cách fix:**

**Option A**: Dùng model nhỏ hơn tạm thời
```bash
# Tải model tiny (39MB) trước
py -m pip install --upgrade huggingface-hub
py -c "from huggingface_hub import snapshot_download; snapshot_download('Systran/faster-whisper-tiny')"
```

**Option B**: Tải model thủ công
1. Download từ: https://huggingface.co/Systran/faster-whisper-medium
2. Giải nén vào: `%USERPROFILE%\.cache\huggingface\hub\models--Systran--faster-whisper-medium\`

**Option C**: Dùng HF_TOKEN để tải nhanh hơn
```bash
# Set token (lấy từ huggingface.co/settings/tokens)
set HF_TOKEN=your_token_here
npm run dev
```

### Lỗi 4: "ffmpeg not found"

**Nguyên nhân**: ffmpeg-static chưa cài đúng

**Cách fix:**
```bash
npm install ffmpeg-static --save-dev
npm rebuild
```

### Lỗi 5: Development server không start

**Nguyên nhân**: Port 5173 đang bị chiếm

**Cách fix:**
```bash
# Kill process đang dùng port
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Hoặc đổi port trong vite.config.ts
```

### Lỗi 6: Hot reload không hoạt động

**Nguyên nhân**: Fast Refresh không tương thích với exports

**Cách fix:**
- Không ảnh hưởng chức năng
- F5 để reload lại app
- Hoặc restart dev server

---

## 📝 Kiểm tra hoàn tất

✅ Checklist đã hoàn thành:

- [ ] Clone/pull code mới nhất
- [ ] `npm install` thành công
- [ ] Python 3.11+ đã cài
- [ ] `pip install faster-whisper` thành công
- [ ] File `.env` đã tạo với API keys
- [ ] `npm run dev` chạy thành công
- [ ] Settings hiện "✅ Sẵn sàng" cho Local Whisper
- [ ] Test ASR với video mẫu thành công
- [ ] Phụ đề xuất hiện đúng trong timeline

---

## 🚀 Bước tiếp theo

Sau khi setup xong:

1. **Test đầy đủ workflow:**
   - Import video → ASR (Local Whisper) → Dịch (DeepSeek AI) → Xuất video

2. **Test với video thật:**
   - Video tiếng Trung 5-10 phút
   - Kiểm tra độ chính xác phụ đề
   - So sánh với OpenAI Whisper API (nếu có)

3. **Build production:**
   - Chạy `npm run prepare:python`
   - Chạy `npm run build:win`
   - Test installer trên máy sạch

---

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra lại từng bước trong guide
2. Đọc phần Troubleshooting
3. Kiểm tra log trong terminal
4. Kiểm tra console của app (Ctrl+Shift+I trong app)

---

## 📚 Tài liệu tham khảo

- [WHISPER_INTEGRATION.md](./WHISPER_INTEGRATION.md) - Chi tiết kỹ thuật
- [BUILD_GUIDE.md](./BUILD_GUIDE.md) - Hướng dẫn build production
- [QUICK_START.md](./QUICK_START.md) - Quick test trong 5 phút
- [CHANGELOG_UI_UPDATE.md](./CHANGELOG_UI_UPDATE.md) - Thay đổi UI mới nhất

---

**Version**: 1.2.3  
**Last Updated**: 2026-08-22  
**Author**: Kiro AI Assistant
