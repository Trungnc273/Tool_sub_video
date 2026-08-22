# Changelog - Cập nhật UI Settings & Workspace

## Ngày: 2026-08-22
## Phiên bản: 1.2.3

---

## 🎯 Mục tiêu
Cập nhật giao diện Settings và Workspace để phản ánh đúng tính năng mới:
- Sử dụng **Local Whisper** (miễn phí) thay vì OpenAI Whisper API
- Sử dụng **DeepSeek API** thay vì OpenAI cho dịch thuật
- Cho phép người dùng chọn nguồn Whisper trong Settings

---

## ✨ Các thay đổi chính

### 1. **Settings.tsx** - Cập nhật giao diện cài đặt

#### 1.1 Đổi tên phần API
- ❌ Cũ: "Cấu hình OpenAI API"
- ✅ Mới: "Cấu hình API Dịch thuật (AI)"

#### 1.2 Ẩn API Key nếu đã có
```tsx
// Nếu đã có API Key (từ file .env hoặc đã nhập trước)
{localSettings.apiKey && (
  <div>✅ API Key đã được cấu hình</div>
)}

// Chỉ hiện form nhập nếu chưa có
{!localSettings.apiKey && (
  <input type="password" placeholder="sk-..." />
)}
```

#### 1.3 Cập nhật Model mặc định
- ❌ Cũ: `gpt-4o-mini` (OpenAI)
- ✅ Mới: `deepseek-v4-flash` (DeepSeek - nhanh & rẻ)

#### 1.4 Cập nhật Base URL mặc định
- ❌ Cũ: `https://api.openai.com/v1`
- ✅ Mới: `https://api.ai-box.vn/v1` (DeepSeek Gateway)

#### 1.5 Thêm dropdown Model mới
```tsx
<select value={model}>
  <option value="deepseek-v4-flash">deepseek-v4-flash (Khuyên dùng)</option>
  <option value="gpt-4o-mini">gpt-4o-mini (OpenAI)</option>
  <option value="gpt-4o">gpt-4o (OpenAI - Chính xác)</option>
  <option value="gpt-3.5-turbo">gpt-3.5-turbo (Cũ)</option>
</select>
```

#### 1.6 Thêm phần mới: "Cấu hình Whisper STT"
```tsx
<div className="glass-panel">
  <h3>Cấu hình Whisper STT (Nhận diện giọng nói)</h3>
  
  {/* Radio button: Local Whisper */}
  <label>
    <input type="radio" value="local" checked={whisperSource === 'local'} />
    🚀 Local Whisper (Khuyên dùng - Miễn phí, Không giới hạn)
    <WhisperStatusIndicator /> {/* Hiện trạng thái: ✅ Sẵn sàng hoặc ❌ Chưa cài */}
  </label>

  {/* Radio button: OpenAI API */}
  <label>
    <input type="radio" value="openai" checked={whisperSource === 'openai'} />
    ☁️ OpenAI Whisper API (Trả phí, giới hạn 25MB)
  </label>

  {/* Hướng dẫn cài đặt nếu chọn Local */}
  {whisperSource === 'local' && (
    <div className="info-box">
      💡 Hướng dẫn cài đặt Local Whisper:
      1. Tải Python 3.11+ từ python.org
      2. Chạy: pip install faster-whisper
      3. Khởi động lại app
    </div>
  )}
</div>
```

#### 1.7 Component mới: `WhisperStatusIndicator`
```tsx
const WhisperStatusIndicator = () => {
  const [status, setStatus] = useState(null)
  
  useEffect(() => {
    // Kiểm tra Python + faster-whisper có sẵn không
    window.api.invoke('check-local-whisper').then(setStatus)
  }, [])

  if (!status?.ready) {
    return <span style={{color: 'red'}}>❌ Chưa cài đặt</span>
  }

  return (
    <div style={{color: 'green'}}>
      ✅ Sẵn sàng - Python {status.pythonVersion}
      📦 faster-whisper đã cài đặt
    </div>
  )
}
```

---

### 2. **Workspace.tsx** - Cập nhật logic Whisper ASR

#### 2.1 Thay đổi logic `handleRunASR()`
```tsx
// ❌ Cũ: Tự động detect, ưu tiên Local
const useLocalWhisper = await checkLocalWhisper()

// ✅ Mới: Dựa vào Settings của người dùng
const preferLocal = settings.whisperSource === 'local' || !settings.whisperSource

if (preferLocal) {
  // Check nếu Local Whisper sẵn sàng
  if (!localCheck.ready) {
    alert('Local Whisper chưa sẵn sàng! Vui lòng cài Python + faster-whisper')
    return
  }
  useLocalWhisper = true
} else {
  // Check nếu có OpenAI API Key
  if (!settings.apiKey) {
    alert('Vui lòng cấu hình OpenAI API Key trong Cài đặt!')
    return
  }
}
```

#### 2.2 Cập nhật UI "Công cụ AI tự động"
```tsx
// Hiện thông tin nguồn Whisper đang dùng
<div>
  <span>1. Nhận diện giọng nói (Whisper STT)</span>
  <span style={{fontSize: '0.7rem'}}>
    {settings.whisperSource === 'local' 
      ? '🚀 Local Whisper (Miễn phí)' 
      : '☁️ OpenAI API (Trả phí)'}
  </span>
</div>

// Hiện model AI đang dùng cho dịch
<div>
  <span>2. Dịch tự động bằng AI</span>
  <span style={{fontSize: '0.7rem'}}>
    Mô hình: {settings.model || 'deepseek-v4-flash'}
  </span>
</div>
```

---

### 3. **AppSettings Interface** - Thêm field mới

```tsx
export interface AppSettings {
  apiKey: string
  baseUrl: string
  elevenLabsApiKey?: string
  model: string
  systemPrompt: string
  characterContext?: string
  nameDictionary?: string
  whisperSource?: 'openai' | 'local'  // ← MỚI
  subtitleStyle: { ... }
}
```

---

## 📝 Hướng dẫn sử dụng

### Bước 1: Mở Settings (Cài đặt hệ thống)
- Click nút **"Cài đặt"** ở góc trên

### Bước 2: Chọn nguồn Whisper
- **Local Whisper (Khuyên dùng)**:
  - ✅ Miễn phí 100%
  - ✅ Không giới hạn số phút
  - ✅ Offline, không cần internet
  - ❗ Cần cài Python + faster-whisper

- **OpenAI API**:
  - ✅ Không cần cài đặt gì
  - ❌ Trả phí theo phút
  - ❌ Giới hạn file 25MB
  - ❗ Cần API Key

### Bước 3: Kiểm tra trạng thái
- Nếu chọn **Local Whisper**:
  - Xem indicator: 
    - ✅ Màu xanh = Sẵn sàng
    - ❌ Màu đỏ = Chưa cài đặt
  - Nếu chưa cài, làm theo hướng dẫn ngay bên dưới

### Bước 4: Lưu cài đặt
- Click nút **"Lưu cài đặt"**

### Bước 5: Test Whisper
1. Import một video
2. Mở **"Công cụ AI"**
3. Click **"Chạy ASR"**
4. Kiểm tra xem có dòng phụ đề xuất hiện không

---

## 🔍 Kiểm tra nhanh

### Settings đã đúng?
```
✅ Phần "Cấu hình API Dịch thuật" (không còn "OpenAI API")
✅ API Key ẩn nếu đã có, hiện nút "Xóa và nhập lại"
✅ Model mặc định là "deepseek-v4-flash"
✅ Có phần "Cấu hình Whisper STT" với 2 radio buttons
✅ Hiện trạng thái Local Whisper (✅ hoặc ❌)
✅ Hướng dẫn cài đặt hiện khi chọn Local
```

### Workspace đã đúng?
```
✅ "1. Nhận diện giọng nói (Whisper STT)" có dòng nhỏ hiện nguồn đang dùng
✅ "2. Dịch tự động bằng AI" có dòng nhỏ hiện model đang dùng
✅ Click "Chạy ASR" → Check Settings trước khi chạy
✅ Hiện lỗi rõ ràng nếu thiếu Python hoặc API Key
```

---

## 🐛 Lỗi có thể gặp & Cách fix

### Lỗi 1: "Local Whisper chưa sẵn sàng"
**Nguyên nhân**: Chưa cài Python hoặc faster-whisper

**Cách fix**:
```bash
# Cài Python 3.11+ từ python.org
# Sau đó chạy:
pip install faster-whisper

# Khởi động lại app
```

### Lỗi 2: "Vui lòng cấu hình API Key"
**Nguyên nhân**: Đã chọn OpenAI API nhưng chưa có key

**Cách fix**:
- Vào Settings → Nhập API Key
- Hoặc: Chuyển sang Local Whisper (miễn phí)

### Lỗi 3: Hot Reload bị lỗi "Fast Refresh incompatible"
**Nguyên nhân**: Export DEFAULT_SETTINGS gây lỗi HMR

**Không ảnh hưởng**: Chỉ cần F5 reload lại app là ổn

---

## 📦 Files đã sửa

```
✅ src/renderer/src/components/Settings.tsx
   - Thêm AppSettings.whisperSource field
   - Thêm WhisperStatusIndicator component
   - Đổi tên "OpenAI API" → "API Dịch thuật (AI)"
   - Ẩn API Key field nếu đã có
   - Thêm section "Cấu hình Whisper STT"
   - Cập nhật DEFAULT_SETTINGS (DeepSeek, Local Whisper)

✅ src/renderer/src/components/Workspace.tsx
   - Cập nhật handleRunASR() để check settings.whisperSource
   - Hiện nguồn Whisper đang dùng trong "Công cụ AI"
   - Hiện model AI đang dùng
   - Cập nhật error messages rõ ràng hơn
```

---

## 🚀 Bước tiếp theo

1. ✅ **Test trên máy dev** (Python đã cài)
   - Mở Settings → Kiểm tra UI
   - Chạy ASR với Local Whisper
   - Chạy Dịch AI với DeepSeek

2. ⏳ **Build production** (chưa test)
   ```bash
   npm run build:win
   ```

3. ⏳ **Test trên máy sạch** (chưa có Python)
   - Cài installer
   - Kiểm tra indicator hiện ❌
   - Làm theo hướng dẫn cài Python
   - Khởi động lại → Indicator hiện ✅

4. ⏳ **Test với file video thật**
   - Video tiếng Trung (~5 phút)
   - ASR → Dịch → Xuất video
   - So sánh kết quả với version cũ

---

## 💡 Lưu ý quan trọng

### 1. Tương thích ngược
- ✅ User cũ vẫn dùng được (whisperSource = undefined → mặc định Local)
- ✅ Settings cũ vẫn load được (chỉ thêm field mới)

### 2. DeepSeek API vs OpenAI API
- **Cùng format**: Compatible với OpenAI API
- **Base URL khác**: `api.ai-box.vn/v1` thay vì `api.openai.com/v1`
- **Model khác**: `deepseek-v4-flash` thay vì `gpt-4o-mini`
- **Rẻ hơn**: ~10x cheaper than OpenAI

### 3. Local Whisper vs OpenAI Whisper
- **Kết quả**: Gần như tương đương
- **Tốc độ**: Local nhanh hơn với GPU, chậm hơn với CPU
- **Giới hạn**: Local không giới hạn, OpenAI 25MB/file
- **Chi phí**: Local miễn phí, OpenAI $0.006/phút

---

## 📊 So sánh trước/sau

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| **Whisper** | Tự động detect Local/OpenAI | User chọn trong Settings |
| **Dịch AI** | OpenAI GPT | DeepSeek (hoặc OpenAI) |
| **Settings UI** | "OpenAI API Key" | "API Dịch thuật (AI)" |
| **API Key** | Luôn hiện | Ẩn nếu đã có |
| **Trạng thái** | Không hiện | Real-time indicator |
| **Hướng dẫn** | Trong alert | Trong Settings |

---

**Kết luận**: UI giờ thân thiện hơn, rõ ràng hơn, và phản ánh đúng tính năng thực tế! 🎉
