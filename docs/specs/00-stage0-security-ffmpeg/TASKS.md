# TASKS.md — Giai đoạn 0: Bảo mật key & Bundle FFmpeg

> Sinh từ PLAN.md đã duyệt (2026-07-02). Tick `[x]` khi xong từng task.

## Nhánh B — Bundle FFmpeg

- [ ] **B1. Cài `ffmpeg-static`** — thêm dependency, xác nhận binary tải về được cho win32-x64.
  - DoD: `node -e "console.log(require('ffmpeg-static'))"` in ra đường dẫn file .exe tồn tại.
- [ ] **B2. Main process dùng binary bundle** — thay 5 chỗ `spawn('ffmpeg', ...)` trong
  `src/main/index.ts` bằng đường dẫn từ `ffmpeg-static` (xử lý cả trường hợp app đóng gói
  asar: đổi `app.asar` → `app.asar.unpacked`). Thêm kiểm tra binary tồn tại, báo lỗi tiếng
  Việt rõ ràng nếu thiếu (FR8).
  - DoD: `npm run dev` chạy, tạo project mới tách audio thành công mà không cần FFmpeg trong PATH.
- [ ] **B3. Cấu hình đóng gói** — thêm `asarUnpack: node_modules/ffmpeg-static/**` vào
  `electron-builder.yml`.
  - DoD: `npm run build:unpack` xong, thư mục output chứa ffmpeg.exe trong `app.asar.unpacked`.

## Nhánh A — Lưu key mã hóa bằng safeStorage

- [ ] **A1. IPC handler secure storage** — main process thêm `save-secure-setting` /
  `load-secure-setting`: mã hóa bằng `safeStorage.encryptString`, lưu base64 vào
  `userData/secure-settings.json`; giải mã khi đọc; lỗi giải mã → trả `''` không crash (FR2,
  FR3, mục 6 SPEC). Nếu `isEncryptionAvailable()` false → trả cờ cho renderer cảnh báo (FR4).
  - DoD: typecheck pass; handler trả đúng giá trị qua round-trip save→load.
- [ ] **A2. Preload expose API** — thêm `saveSecureSetting(key, value)` và
  `loadSecureSetting(key)` vào `src/preload/index.ts` + type trong `index.d.ts`.
  - DoD: renderer gọi được `window.api.saveSecureSetting` không lỗi type.
- [ ] **A3. App.tsx tách luồng lưu key** — khi lưu settings: 2 field `apiKey`,
  `elevenLabsApiKey` đi qua secure API, phần còn lại vào localStorage như cũ (loại 2 field
  này khỏi JSON); khi khởi động: load 2 field từ secure API merge vào state. Xóa key tồn dư
  trong `localStorage['vietsub_settings']` cũ nếu có (dọn plaintext).
  - DoD: nhập key → Lưu → tắt app → mở lại: key còn nguyên trong UI Settings;
    `localStorage['vietsub_settings']` không chứa chuỗi key; file secure-settings.json không
    đọc được key bằng text editor.

## Kiểm tra chấp nhận cuối (theo SPEC.md mục 7)

- [ ] **V1.** `grep -ri "sk-proj\|sk_[0-9a-f]" src/` không ra key thật.
- [ ] **V2.** `npm run typecheck` + `npm run lint` pass, không lỗi mới.
- [ ] **V3.** Chạy app thật: tạo project, tách audio (FFmpeg bundle), lưu/đọc key sau restart.
