# TASKS.md — Giai đoạn 0: Bảo mật key & Bundle FFmpeg

> Sinh từ PLAN.md đã duyệt (2026-07-02). Tick `[x]` khi xong từng task.

## Nhánh B — Bundle FFmpeg

- [x] **B1. Cài `ffmpeg-static`** — thêm dependency, xác nhận binary tải về được cho win32-x64.
  - DoD: `node -e "console.log(require('ffmpeg-static'))"` in ra đường dẫn file .exe tồn tại.
- [x] **B2. Main process dùng binary bundle** — thay 5 chỗ `spawn('ffmpeg', ...)` trong
  `src/main/index.ts` bằng đường dẫn từ `ffmpeg-static` (xử lý cả trường hợp app đóng gói
  asar: đổi `app.asar` → `app.asar.unpacked`). Thêm kiểm tra binary tồn tại, báo lỗi tiếng
  Việt rõ ràng nếu thiếu (FR8).
  - DoD: `npm run dev` chạy, tạo project mới tách audio thành công mà không cần FFmpeg trong PATH.
- [x] **B3. Cấu hình đóng gói** — thêm `asarUnpack: node_modules/ffmpeg-static/**` vào
  `electron-builder.yml`.
  - DoD: `npm run build:unpack` xong, thư mục output chứa ffmpeg.exe trong `app.asar.unpacked`.

## Nhánh A — Lưu key mã hóa bằng safeStorage

- [x] **A1. IPC handler secure storage** — main process thêm `save-secure-setting` /
  `load-secure-setting`: mã hóa bằng `safeStorage.encryptString`, lưu base64 vào
  `userData/secure-settings.json`; giải mã khi đọc; lỗi giải mã → trả `''` không crash (FR2,
  FR3, mục 6 SPEC). Nếu `isEncryptionAvailable()` false → trả cờ cho renderer cảnh báo (FR4).
  - DoD: typecheck pass; handler trả đúng giá trị qua round-trip save→load.
- [x] **A2. Preload expose API** — thêm `saveSecureSetting(key, value)` và
  `loadSecureSetting(key)` vào `src/preload/index.ts` + type trong `index.d.ts`.
  - DoD: renderer gọi được `window.api.saveSecureSetting` không lỗi type.
- [x] **A3. App.tsx tách luồng lưu key** — khi lưu settings: 2 field `apiKey`,
  `elevenLabsApiKey` đi qua secure API, phần còn lại vào localStorage như cũ (loại 2 field
  này khỏi JSON); khi khởi động: load 2 field từ secure API merge vào state. Xóa key tồn dư
  trong `localStorage['vietsub_settings']` cũ nếu có (dọn plaintext).
  - DoD: nhập key → Lưu → tắt app → mở lại: key còn nguyên trong UI Settings;
    `localStorage['vietsub_settings']` không chứa chuỗi key; file secure-settings.json không
    đọc được key bằng text editor.

## Kiểm tra chấp nhận cuối (theo SPEC.md mục 7)

- [x] **V1.** `grep -ri "sk-proj\|sk_[0-9a-f]" src/` không ra key thật.
- [x] **V2.** `npm run typecheck` + `npm run lint` pass, không lỗi mới.
- [x] **V3a.** (AI test, 2026-07-02) Test kỹ thuật từng thành phần với video mẫu 10s:
  - Key lưu qua Settings UI → file `secure-settings.json` chỉ chứa chuỗi mã hóa `enc:...`,
    không đọc được key; localStorage không còn key plaintext. ✅
  - FFmpeg bundle: tạo video, tách audio (đúng args app), reverse, **hardsub với libass**
    (xác minh bằng ảnh frame — phụ đề hiện đúng), trộn TTS + hardsub 1 lệnh filter_complex. ✅
  - API: Whisper ASR OK (HTTP 200, trả SRT), GPT dịch OK (trả đúng JSON tiếng Việt),
    OpenAI TTS OK, Edge TTS OK (19KB audio tiếng Việt). ✅
  - ⚠️ ElevenLabs key trong .env bị 401 (key không còn hiệu lực) — cần key mới nếu muốn
    dùng giọng ElevenLabs; không phải lỗi app.
  - Đường lỗi: video không có phụ đề nhúng → FFmpeg fail đúng cách, app sẽ báo lỗi rõ. ✅
- [x] **V3b.** (Người dùng test, 2026-07-03 OK) Thao tác UI thật: tạo project với video thật, chạy ASR,
  dịch, lồng tiếng, xuất video end-to-end.
