# 📦 Sub 4.0 - Hướng dẫn Setup & Test

> **Repo GitHub**: https://github.com/Trungnc273/Tool_sub_video  
> **Tình trạng**: ✅ Code đã push - Sẵn sàng test!

---

## 🎯 Có gì mới?

- ✅ **Local Whisper STT** - Nhận diện giọng nói miễn phí, không giới hạn, chạy offline
- ✅ **DeepSeek API** - API dịch thuật rẻ hơn OpenAI 10 lần
- ✅ **Settings UI mới** - Chọn nguồn Whisper (Local/OpenAI), hiển thị trạng thái real-time
- ✅ **Ẩn API Key** - Nếu đã cấu hình trong .env thì không phải nhập lại trong app

---

## ⚡ Setup nhanh - 3 bước (10 phút)

### 📌 Yêu cầu trước khi bắt đầu:

1. **Node.js 16+** - [Tải tại đây](https://nodejs.org/) (chọn LTS)
2. **Python 3.11+** - [Tải tại đây](https://www.python.org/downloads/)
   - ⚠️ **LƯU Ý**: Khi cài Python, **PHẢI TICK** ☑️ "Add Python to PATH"
3. **Git** - [Tải tại đây](https://git-scm.com/downloads)

---

### Bước 1️⃣: Tải code về

Mở **Command Prompt** (cmd) hoặc **PowerShell**:

```bash
# Clone repo (lần đầu)
git clone https://github.com/Trungnc273/Tool_sub_video.git
cd Tool_sub_video

# HOẶC nếu đã có sẵn, chỉ cần pull:
cd Tool_sub_video
git pull origin main
```

---

### Bước 2️⃣: Cài đặt dependencies

**Vẫn trong thư mục `Tool_sub_video`**, chạy lần lượt:

```bash
# 1. Cài Node.js packages
npm install

# 2. Cài Python + faster-whisper
py -m pip install --upgrade pip
py -m pip install faster-whisper

# 3. (Optional) Kiểm tra cài đặt thành công
py --version
py -c "import faster_whisper; print('✅ faster-whisper OK')"
```

**Thời gian ước tính**: ~5-7 phút (tùy tốc độ mạng)

---

### Bước 3️⃣: Tạo file .env

1. Copy file mẫu:
   ```bash
   copy .env.example .env
   ```

2. Mở file `.env` bằng Notepad/VSCode, nội dung như sau:

   ```env
   # DeepSeek API - Đã có key sẵn, không cần đổi
   DEEPSEEK_API_KEY=sk-0gD11a3Jc7SzGoU6EKVdxPxKfEOWLtHry5TlrluUyBK7iXZY
   DEEPSEEK_BASE_URL=https://api.ai-box.vn/v1
   DEEPSEEK_MODEL=deepseek-v4-flash
   ```

3. Lưu lại file `.env`

---

### Bước 4️⃣: Chạy app

```bash
npm run dev
```

**Kết quả**: App sẽ tự động mở trong vài giây

---

## ✅ Test chức năng Local Whisper (5 phút)

### Test 1: Kiểm tra Python + Whisper đã sẵn sàng

1. Mở app → Click **⚙️ Cài đặt** (góc trên)
2. Cuộn xuống mục **"Cấu hình Whisper STT"**
3. Xem trạng thái:
   - ✅ **"Sẵn sàng - Python 3.x.x"** + **"faster-whisper đã cài đặt"** → OK!
   - ❌ **"Chưa cài đặt Python..."** → Quay lại Bước 2

---

### Test 2: Thử nhận diện giọng nói với video ngắn

1. Tải video test ngắn (1-3 phút) - VD: https://www.youtube.com/watch?v=dQw4w9WgXcQ
2. Trong app: Click **➕ Tạo dự án mới**
3. Chọn video vừa tải
4. Sau khi import xong, click **🤖 Công cụ AI tự động** (bên trái)
5. Click **▶️ Chạy ASR (Nhận diện giọng nói)**
6. Chọn ngôn ngữ (VD: Tiếng Trung, Tiếng Anh, Tiếng Việt)
7. Click **Bắt đầu**

**Lưu ý lần đầu chạy**:
- ⏳ Model sẽ tải về (~1.5GB cho model `medium`)
- 📊 Xem tiến độ trong log bên dưới
- ⏱️ Ước tính: 10-15 phút (tùy mạng)
- 🚀 Lần sau chạy nhanh hơn (đã cache model)

**Kết quả mong đợi**:
- Phụ đề xuất hiện trong timeline
- Có thể play video xem phụ đề có khớp không

---

### Test 3: Dịch phụ đề bằng AI

1. Sau khi có phụ đề từ ASR, click **🌐 Dịch AI** (cũng trong Công cụ AI)
2. Chọn ngôn ngữ đích: **Tiếng Việt**
3. Click **Bắt đầu dịch**
4. Chờ 10-30 giây (tùy số lượng câu)

**Kết quả**: Phụ đề đã dịch hiện màu xanh, có thể chỉnh sửa thủ công

---

### Test 4: Xuất video có phụ đề

1. Click **📥 Xuất Video** (góc dưới phải)
2. Chọn chế độ: **Hardsub (phụ đề cứng)**
3. Chọn vị trí lưu file
4. Click **Xuất**
5. Chờ xử lý xong (tùy độ dài video)

**Kết quả**: File video mới có phụ đề đã được đốt cứng vào

---

## 📋 Checklist - Đánh dấu khi hoàn thành

### ✅ Cài đặt (Setup)
- [ ] Đã cài Node.js 16+ (chạy `node -v` để kiểm tra)
- [ ] Đã cài Python 3.11+ (chạy `py --version` để kiểm tra)
- [ ] Clone/pull code thành công
- [ ] `npm install` chạy xong không lỗi
- [ ] `py -m pip install faster-whisper` thành công
- [ ] File `.env` đã tạo với đúng nội dung

### ✅ Test cơ bản (20 phút)
- [ ] `npm run dev` → App mở được
- [ ] Vào **Cài đặt** → Thấy "✅ Sẵn sàng - Python 3.x.x"
- [ ] Tạo dự án mới + import video ngắn (1-3 phút)
- [ ] Chạy ASR (Nhận diện giọng nói) → Có phụ đề hiện ra
- [ ] Chạy Dịch AI → Phụ đề được dịch sang tiếng Việt
- [ ] Xuất video → File video có phụ đề

### ✅ Test nâng cao (Optional - 1 giờ)
- [ ] Test với video tiếng Trung 5-10 phút
- [ ] Test với video tiếng Anh
- [ ] Test với video tiếng Việt
- [ ] Test xuất video với TTS (giọng đọc AI)
- [ ] So sánh chất lượng Local Whisper vs OpenAI API (nếu có key)

---

## 📚 Tài liệu chi tiết

### Cho User (nhanh):
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Hướng dẫn từ A-Z
- **[QUICK_START.md](./QUICK_START.md)** - Test nhanh trong 5 phút

### Cho Developer (kỹ thuật):
- **[WHISPER_INTEGRATION.md](./WHISPER_INTEGRATION.md)** - Chi tiết tích hợp
- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)** - Hướng dẫn build production
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Tổng quan code
- **[CHANGELOG_UI_UPDATE.md](./CHANGELOG_UI_UPDATE.md)** - Thay đổi UI mới

### Debugging:
- **[CHECK_MODEL_DOWNLOAD.md](./CHECK_MODEL_DOWNLOAD.md)** - Kiểm tra tải model
- **[TEST_RESULTS.md](./TEST_RESULTS.md)** - Kết quả test tự động

---

## 🐛 Gặp lỗi? Xem đây!

### ❌ Lỗi 1: "Local Whisper chưa sẵn sàng" hoặc ❌ trong Settings

**Nguyên nhân**: Python hoặc faster-whisper chưa cài đúng

**Cách fix**:
```bash
# Bước 1: Kiểm tra Python đã cài chưa
py --version
# Kết quả mong đợi: Python 3.11.x hoặc 3.12.x

# Bước 2: Nếu không có Python, tải và cài tại: https://www.python.org/downloads/
# ⚠️ NHỚ TICK: "Add Python to PATH" khi cài

# Bước 3: Cài faster-whisper
py -m pip install --upgrade pip
py -m pip install faster-whisper

# Bước 4: Kiểm tra cài đặt
py -c "import faster_whisper; print('OK')"
# Kết quả mong đợi: OK

# Bước 5: Restart app
```

---

### ❌ Lỗi 2: Model tải quá chậm (trên 15 phút)

**Nguyên nhân**: Mạng chậm hoặc HuggingFace Hub lag

**Cách fix - Dùng model nhỏ hơn để test**:

Model `medium` (~1.5GB) dùng cho production, nhưng để test nhanh có thể dùng `tiny` (~39MB):

```bash
# Cách 1: Pre-download model tiny
py -c "from huggingface_hub import snapshot_download; snapshot_download('Systran/faster-whisper-tiny')"

# Cách 2: Đổi model mặc định trong code (tạm thời)
```

Mở file `src\main\index.ts`, tìm dòng ~1025:
```typescript
// TÌM:
model || 'medium'

// ĐỔI THÀNH:
model || 'tiny'
```

Sau khi test OK với `tiny`, có thể đổi lại `medium` cho chất lượng cao hơn.

**So sánh model**:
| Model | Dung lượng | Tốc độ | Chất lượng | Dùng khi nào |
|-------|-----------|--------|-----------|--------------|
| `tiny` | 39MB | Rất nhanh | Tạm được | Test nhanh |
| `base` | 74MB | Nhanh | Khá tốt | Tiếng Anh đơn giản |
| `small` | 244MB | Trung bình | Tốt | Cân bằng |
| `medium` | 1.5GB | Chậm hơn | Rất tốt | **Khuyên dùng** |
| `large-v3` | 2.9GB | Chậm | Xuất sắc | Production chuyên nghiệp |

---

### ❌ Lỗi 3: "Process exited with code -1" hoặc code 4294967295

**Nguyên nhân**: 
- Model tải bị gián đoạn (internet mất, ấn Stop giữa chừng)
- Model download bị lỗi/corrupt

**Cách fix**:
```bash
# Bước 1: Xóa model cache bị lỗi
rmdir /s /q "%USERPROFILE%\.cache\huggingface\hub\models--Systran--faster-whisper-medium"

# Bước 2: Chạy lại ASR trong app (model sẽ tải lại từ đầu)
```

**Lưu ý**: Để tránh lỗi này:
- Đảm bảo internet ổn định khi tải model lần đầu
- Không tắt app/Stop process khi đang tải model
- Có thể dùng model `tiny` test trước, sau đó mới tải `medium`

---

### ❌ Lỗi 4: npm install báo lỗi node-gyp (Windows)

**Nguyên nhân**: Thiếu build tools cho native modules

**Cách fix**:
```bash
# Cài Windows Build Tools (chạy cmd as Administrator)
npm install --global windows-build-tools

# Sau đó chạy lại
npm install
```

---

### ❌ Lỗi 5: "Cannot find module..." khi chạy npm run dev

**Nguyên nhân**: Dependencies chưa cài đủ hoặc node_modules bị lỗi

**Cách fix**:
```bash
# Xóa node_modules và cài lại
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

### ❌ Lỗi 6: App mở nhưng không load được video

**Nguyên nhân**: Thiếu codec hoặc FFmpeg

**Cách fix**:
- Thử với video format khác (MP4, MKV, AVI)
- Cài K-Lite Codec Pack: https://codecguide.com/download_kl.htm

---

### 🔍 Kiểm tra tiến độ tải model (khi chạy lần đầu)

Mở **Command Prompt mới** khi app đang chạy ASR:

```bash
# Xem dung lượng đã tải
powershell -Command "$files = Get-ChildItem \"$env:USERPROFILE\.cache\huggingface\hub\models--Systran--faster-whisper-medium\" -Recurse -File -ErrorAction SilentlyContinue; $totalMB = ($files | Measure-Object -Property Length -Sum).Sum / 1MB; Write-Host \"Đã tải: $([math]::Round($totalMB, 1)) MB / 1500 MB\""
```

Chạy lệnh này nhiều lần để xem tiến độ có tăng không.

---

### 📞 Vẫn gặp lỗi khác?

**Các bước debug**:

1. **Mở DevTools trong app**: Nhấn `Ctrl + Shift + I`
2. **Xem tab Console**: Có lỗi màu đỏ không? Chụp lại
3. **Xem tab Network**: Có request nào bị failed (màu đỏ)?
4. **Check log khi chạy ASR**: Có message lỗi cụ thể?

**Chuẩn bị thông tin khi báo lỗi**:
- [ ] Screenshot lỗi trong app
- [ ] Log trong DevTools Console
- [ ] Phiên bản Python (`py --version`)
- [ ] Phiên bản Node.js (`node -v`)
- [ ] OS version (Windows 10/11, version bao nhiêu)
- [ ] Các bước đã thử để tái hiện lỗi

---

## 🔧 Cấu trúc Code mới

```
sub 4.0/
├── src/
│   ├── main/
│   │   ├── index.ts                      (Updated - IPC handlers)
│   │   └── whisper-local.ts              (NEW - Local Whisper logic)
│   ├── preload/
│   │   ├── index.ts                      (Updated - API methods)
│   │   └── index.d.ts                    (Updated - Type definitions)
│   └── renderer/src/components/
│       ├── Settings.tsx                  (Updated - UI changes)
│       └── Workspace.tsx                 (Updated - ASR logic)
├── python_modules/                       (NEW)
│   ├── whisper_transcribe.py             (Python script)
│   ├── requirements.txt                  (Dependencies)
│   └── README.md                         (Python docs)
├── scripts/
│   └── prepare-python.js                 (NEW - Build script)
├── resources/
│   └── python_modules/                   (Copy for production)
├── electron-builder.yml                  (Updated - Bundle Python)
├── package.json                          (Updated - Scripts)
└── *.md                                  (8 tài liệu mới)
```

---

## 💡 Tips & Tricks

### Tip 1: Tăng tốc test

Dùng model `tiny` cho test nhanh (chất lượng OK cho test):
- Tải nhanh: 39MB vs 1.5GB
- Chạy nhanh: ~10 giây vs ~30 giây (video 2 phút)
- Chất lượng: Đủ tốt cho test, production dùng `medium`

### Tip 2: Kiểm tra tiến độ tải model

Mở Command Prompt mới khi app đang chạy:
```bash
# Xem dung lượng đã tải
powershell -Command "$files = Get-ChildItem \"$env:USERPROFILE\.cache\huggingface\hub\models--Systran--faster-whisper-medium\" -Recurse -File -ErrorAction SilentlyContinue; $totalMB = ($files | Measure-Object -Property Length -Sum).Sum / 1MB; Write-Host \"Progress: $([math]::Round($totalMB, 1)) MB / 1500 MB\""
```

### Tip 3: Build production

```bash
# Chuẩn bị Python embedded (chỉ 1 lần)
npm run prepare:python

# Build installer
npm run build:win

# File output: dist/Sub 4.0 Setup 1.2.3.exe (~150MB)
```

---

## 📊 So sánh Before/After

| Feature | Before | After |
|---------|--------|-------|
| **Whisper** | OpenAI API (trả phí) | Local (miễn phí) + OpenAI (option) |
| **File limit** | 25MB | Không giới hạn |
| **Cost** | $0.006/phút | $0 |
| **Tốc độ** | API network | Local (nhanh hơn với GPU) |
| **API dịch** | OpenAI GPT | DeepSeek (rẻ hơn 10x) |
| **Settings UI** | Chỉ API key | Chọn nguồn, status indicator |
| **API Key** | Luôn hiện | Ẩn nếu có .env |

---

## 🎓 Kiến thức đã áp dụng

### Architecture:
- ✅ Electron IPC (Main ↔ Renderer communication)
- ✅ Child Process (Spawn Python từ Node.js)
- ✅ TypeScript Interfaces (Type-safe API)
- ✅ React Hooks (useState, useEffect)

### Tools:
- ✅ Python Embedded (Portable Python runtime)
- ✅ faster-whisper (Optimized Whisper inference)
- ✅ electron-builder (App packaging)
- ✅ Git workflow (Feature branch, commits, push)

### Best Practices:
- ✅ Error handling (Try-catch, error messages)
- ✅ Progress feedback (Real-time status updates)
- ✅ Documentation (8 markdown files)
- ✅ .gitignore (Exclude large files)
- ✅ Type safety (TypeScript interfaces)

---

## 📞 Liên hệ & Support

Nếu gặp vấn đề:

1. ✅ **Đọc tài liệu**: Xem [SETUP_GUIDE.md](./SETUP_GUIDE.md) trước
2. ✅ **Check logs**: Mở DevTools (Ctrl+Shift+I) xem console
3. ✅ **Test đơn giản**: Thử với video ngắn, model tiny
4. ✅ **Hỏi cụ thể**: Chụp màn hình lỗi + log

---

## ✨ Kết luận

🎉 **Tích hợp hoàn tất!** Code đã clean, đã test cơ bản, đã push lên Git.

**Bước tiếp theo của bạn**:
1. Pull code về
2. Setup theo SETUP_GUIDE.md
3. Test với video thật
4. Report lỗi (nếu có)
5. Build production khi mọi thứ OK

**Timeline ước tính**:
- ⏱️ Setup: 10-15 phút
- ⏱️ Test cơ bản: 30 phút
- ⏱️ Test đầy đủ: 1-2 giờ
- ⏱️ Build production: 5 phút

---

## 🏗️ Build Production Installer (Cho developer)

Khi đã test OK và muốn tạo file `.exe` để chia sẻ:

### Bước 1: Chuẩn bị Python Embedded

```bash
npm run prepare:python
```

Script này sẽ:
- Tải Python Embedded (~30MB)
- Cài faster-whisper vào Python embedded
- Đóng gói vào `resources/python/`

⏱️ **Thời gian**: 10-15 phút (chỉ chạy 1 lần)

### Bước 2: Build installer

```bash
npm run build:win
```

⏱️ **Thời gian**: 5-10 phút

### Kết quả:

File output: `dist\Sub 4.0 Setup 1.2.3.exe` (~150MB)

File này có thể chia sẻ cho người khác, họ không cần cài Python/Node.js, chỉ cần:
1. Double-click file `.exe`
2. Next → Next → Install
3. Mở app và dùng!

---

## ⏱️ Timeline ước tính

| Giai đoạn | Thời gian | Ghi chú |
|-----------|-----------|---------|
| **Setup ban đầu** | 10-15 phút | Clone + npm install + pip install |
| **Tải model lần đầu** | 10-20 phút | Tùy mạng (1.5GB cho medium) |
| **Test cơ bản** | 20-30 phút | Import + ASR + Dịch + Xuất |
| **Test đầy đủ** | 1-2 giờ | Nhiều video, nhiều ngôn ngữ |
| **Build production** | 15-20 phút | prepare:python + build:win |
| **TỔNG (lần đầu)** | ~1.5-2 giờ | Setup + Test + Build |
| **TỔNG (lần sau)** | ~2 phút | Chỉ git pull + npm install |

---

## 📮 Feedback & Support

Nếu gặp vấn đề hoặc có góp ý:

### Cách báo lỗi hiệu quả:

1. 📖 **Đọc docs**: [SETUP_GUIDE.md](./SETUP_GUIDE.md) + phần "Gặp lỗi?" ở trên
2. 🔍 **Check logs**: DevTools (`Ctrl+Shift+I`) → Console tab
3. 🧪 **Thử đơn giản hóa**: Video ngắn hơn + model tiny
4. 📸 **Chuẩn bị thông tin**:
   - [ ] Screenshot lỗi trong app
   - [ ] Log trong Console (copy text hoặc chụp ảnh)
   - [ ] Các bước để tái hiện lỗi (step-by-step)
   - [ ] Environment info:
     - OS: Windows 10/11 (version?)
     - Python version: `py --version`
     - Node version: `node -v`
     - Video: format, độ dài, ngôn ngữ

### Liên hệ:

- 💬 **GitHub Issues**: https://github.com/Trungnc273/Tool_sub_video/issues
- 📧 **Email/Discord**: (thêm link nếu có)

---

## 🎯 Mục tiêu thành công

- [ ] App chạy được trên máy teammate
- [ ] Local Whisper hoạt động ổn định
- [ ] Chất lượng nhận diện >90% accuracy (tiếng Trung/Anh)
- [ ] DeepSeek dịch mượt và tự nhiên
- [ ] Xuất video không lỗi, phụ đề khớp
- [ ] Build installer thành công và test được

---

**Happy coding! 🚀**

📅 _Last updated: 2026-08-22_  
🏷️ _Version: 1.2.3_  
📌 _Commit: [f2c7971](https://github.com/Trungnc273/Tool_sub_video/commit/f2c7971)_  
👨‍💻 _Maintainer: [@Trungnc273](https://github.com/Trungnc273)_
