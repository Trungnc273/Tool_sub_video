# PLAN.md — Giai đoạn 0: Bảo mật key & Bundle FFmpeg

> Trạng thái: **CHỜ DUYỆT** — chưa sửa bất kỳ file code nào. Cần chủ dự án xác nhận trước khi
> chuyển sang TASKS.md và bắt đầu code, theo AGENTS.md.

## 1. Cách tiếp cận (Approach)

Chia làm 2 nhánh việc độc lập, không chồng chéo, có thể làm/duyệt riêng nếu muốn:

**Nhánh A — Bảo mật key:**
Dùng `electron.safeStorage` (built-in, không cần thêm dependency) để mã hóa 2 field nhạy cảm
(`apiKey`, `elevenLabsApiKey`) trước khi ghi ra đĩa. Thêm 2 IPC handler mới trong main process.
Renderer vẫn giữ state `AppSettings` như cũ, chỉ đổi nơi lưu 2 field đó.

**Nhánh B — Bundle FFmpeg:**
Dùng package `ffmpeg-static` (cung cấp binary FFmpeg theo platform, tải về lúc `npm install`).
Main process đổi mọi `spawn('ffmpeg', ...)` thành `spawn(ffmpegPath, ...)` với `ffmpegPath`
lấy từ `ffmpeg-static`, và khai báo `asarUnpack` cho package này (vì binary không chạy được
trong asar archive).

## 2. Danh sách file sẽ đổi

| File | Thay đổi | Nhánh |
|---|---|---|
| `package.json` | thêm dependency `ffmpeg-static` | B |
| `src/main/index.ts` | (1) 6 chỗ `spawn('ffmpeg', ...)` → dùng `ffmpegPath` từ `ffmpeg-static`; (2) thêm IPC handler `save-secure-setting` / `load-secure-setting` dùng `safeStorage` | A + B |
| `electron-builder.yml` | thêm `asarUnpack` cho `node_modules/ffmpeg-static/**` | B |
| `src/preload/index.ts` | thêm 2 API mới: `saveSecureSetting`, `loadSecureSetting` | A |
| `src/preload/index.d.ts` | khai báo type cho 2 API mới | A |
| `src/renderer/src/components/Settings.tsx` | (1) xóa key thật khỏi `DEFAULT_SETTINGS`, để `''`; (2) khi save/load, gọi API secure setting thay vì để key đi qua `localStorage` chung | A |
| `src/renderer/src/App.tsx` | điều chỉnh `handleSaveSettings` / load-on-mount để tách 2 field secure ra khỏi luồng `localStorage.setItem('vietsub_settings', ...)` | A |

**Không đổi:** logic FFmpeg filter/tham số, luồng UI Settings, cấu trúc `AppSettings` (giữ
nguyên field, chỉ đổi cơ chế lưu 2 field).

## 3. Luồng dữ liệu mới (Nhánh A)

```
Settings.tsx (nhập key)
   → App.tsx.handleSaveSettings(newSettings)
        → tách apiKey, elevenLabsApiKey ra khỏi object
        → window.api.saveSecureSetting('apiKey', value)   [IPC, main process mã hóa bằng safeStorage, ghi file riêng trong userData]
        → localStorage.setItem('vietsub_settings', JSON.stringify(rest))  [phần còn lại như cũ]

Khởi động app
   → App.tsx useEffect load
        → window.api.loadSecureSetting('apiKey')  [main process giải mã, trả plaintext qua IPC]
        → merge vào settings state
        → localStorage load phần còn lại như cũ
```

Lưu ý bảo mật: giá trị plaintext chỉ tồn tại trong bộ nhớ (state React) khi app đang chạy,
không bao giờ ghi plaintext xuống đĩa hoặc log ra console.

## 4. Luồng dữ liệu mới (Nhánh B)

```
main/index.ts (top of file)
   import ffmpegPath from 'ffmpeg-static'
   // ffmpegPath: string — đường dẫn tuyệt đối tới binary đã bundle

Mọi nơi hiện có spawn('ffmpeg', [...args])
   → spawn(ffmpegPath, [...args])   // args giữ nguyên 100%
```

Áp dụng cho 6 vị trí xác nhận trong `main/index.ts`: `getVideoDuration` (dòng 64),
`extract-audio` (142), `burn-subtitles` (585), `export-dubbed-audio` (không dùng ffmpeg trực
tiếp — dùng chung `burn-subtitles`? — **cần xác nhận lại khi code**), `extract-embedded-
subtitles` (1002), `reverse-video` (1050).

## 5. Rủi ro & đánh đổi

| Rủi ro | Mức độ | Giảm thiểu |
|---|---|---|
| `ffmpeg-static` có thể không có build cho mọi platform/arch (ví dụ Windows ARM) | Thấp (target hiện tại là Windows x64) | Xác nhận platform mục tiêu trước khi cài |
| `safeStorage` phụ thuộc keyring hệ điều hành, có thể không khả dụng trên một số máy Linux | Thấp (target hiện tại là Windows) | FR4 trong SPEC.md đã có fallback |
| Đổi cơ chế lưu key có thể làm mất key đã lưu cũ của người dùng hiện tại (localStorage cũ) | Trung bình — **ảnh hưởng trực tiếp đến bạn (người đang dùng app)** | Thêm bước migrate 1 lần: nếu phát hiện key cũ trong `localStorage['vietsub_settings']`, tự động chuyển sang secure storage rồi xóa khỏi localStorage |
| Dung lượng gói cài đặt tăng ~70-100MB do bundle FFmpeg | Chấp nhận được (đã thống nhất ở SPEC.md NFR2) | Không cần xử lý |
| `asarUnpack` cấu hình sai khiến binary không chạy được trong bản build | Trung bình | Test bằng `npm run build:unpack` trước, kiểm tra thủ công trước khi build:win đầy đủ |

## 6. Quyết định đã chốt cùng chủ dự án (2026-07-02)

1. **Key test hiện tại (`sk-proj--Oz_Y...`, `sk_70bf10b1...`)**: KHÔNG revoke ngay — chủ dự
   án muốn tiếp tục dùng để test. Xử lý: chuyển sang `.env` tại máy dev, **không commit**,
   không bao giờ đóng gói vào build. `.env` chỉ phục vụ máy dev cá nhân của chủ dự án; người
   dùng cuối vẫn luôn tự nhập key riêng của họ qua Settings UI (không liên quan tới `.env`).
2. **Không cần migrate key cũ từ localStorage** — chủ dự án sẽ nhập lại key qua Settings UI
   sau khi cơ chế `safeStorage` hoàn thành. Bỏ bước migrate tự động khỏi phạm vi Giai đoạn 0
   (giảm rủi ro, đơn giản hơn).
3. **FFmpeg**: xác nhận dùng `ffmpeg-static`, KHÔNG dùng Docker. Đã giải thích: Electron app
   chạy trực tiếp trên máy người dùng cuối (không có khái niệm server/container như web);
   `ffmpeg-static` đóng vai trò tương đương "tiện lợi kiểu Docker" — tự tải binary FFmpeg lúc
   `npm install`, tự đóng gói kèm app lúc build, người dùng cuối không cần cài gì thêm.
4. **Phạm vi platform**: chỉ Windows ở Giai đoạn 0 (khớp môi trường dev + mục tiêu phát hành
   trước mắt). macOS/Linux để Giai đoạn 3.
5. **Git**: chủ dự án sẽ khởi tạo git cho **1 repo duy nhất** (đúng chuẩn Electron — không
   tách fe/be như web vì main+preload+renderer đóng gói chung 1 app). Cần làm **trước khi
   code Giai đoạn 0** để: (a) có `.gitignore` chặn `.env` trước khi nó được tạo, (b) theo dõi
   được lịch sử thay đổi qua từng task.

## 6b. Việc cần làm trước khi vào TASKS.md

- [ ] Chủ dự án chạy `git init` (hoặc xác nhận để tôi làm hộ).
- [ ] Thêm `.env` vào `.gitignore` **trước** khi tạo file `.env` chứa key test.
- [ ] Chủ dự án đặt key test vào `.env` theo format sẽ thống nhất ở TASKS.md
      (`OPENAI_API_KEY_DEV=...`, `ELEVENLABS_API_KEY_DEV=...`) — dùng riêng cho dev, không
      liên quan tới cơ chế `safeStorage` của người dùng cuối.

## 7. Sau khi PLAN.md được duyệt

Tôi sẽ sinh `TASKS.md` chia nhỏ thành các task nguyên tử (≤4 giờ/task) cho cả 2 nhánh A và B,
đánh dấu `[x]` khi hoàn thành từng bước, và verify bằng chạy thử thực tế (không chỉ đọc code)
trước khi báo cáo xong.
