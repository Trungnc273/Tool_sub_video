# SPEC.md — Giai đoạn 0: Bảo mật key & Bundle FFmpeg

## 1. Bối cảnh (Context)
Xem chi tiết tại [`CONTEXT.md`](./CONTEXT.md). Tóm tắt: hai lỗi chặn phát hành — key thật
hard-code trong source, và FFmpeg không được đóng gói cùng app.

## 2. Tác nhân (Actors)
- **Chủ dự án**: người duyệt PLAN.md, xác nhận key đã được revoke.
- **Người dùng cuối**: cài app, nhập API key riêng của họ, dùng tính năng FFmpeg mà không
  cần cài đặt gì thêm.

## 3. Yêu cầu chức năng (Functional Requirements — cú pháp EARS)

### 3.1 Bảo mật API key

- **FR1**: Hệ thống SHALL không chứa bất kỳ giá trị API key thật nào trong mã nguồn hoặc
  file cấu hình được commit vào git.
- **FR2**: WHEN người dùng nhập API key trong màn Settings và bấm "Lưu cài đặt", hệ thống
  SHALL mã hóa giá trị đó bằng `electron.safeStorage` trước khi ghi xuống đĩa.
- **FR3**: WHEN ứng dụng khởi động, hệ thống SHALL giải mã key đã lưu (nếu có) để nạp vào
  Settings, và KHÔNG SHALL hiển thị giá trị đã giải mã ở dạng plaintext trong bất kỳ log nào.
- **FR4**: WHERE `safeStorage.isEncryptionAvailable()` trả về `false` (một số môi trường Linux
  thiếu keyring), hệ thống SHALL báo cho người dùng rằng key sẽ được lưu ở dạng chưa mã hóa
  và cho phép họ xác nhận tiếp tục hoặc hủy.
- **FR5**: Giá trị mặc định (default) của mọi field key trong `DEFAULT_SETTINGS` SHALL là
  chuỗi rỗng `''`.

### 3.2 Bundle FFmpeg

- **FR6**: Hệ thống SHALL đóng gói binary FFmpeg cùng bản build Windows (`build:win`), sao
  cho người dùng cài app xong dùng được ngay không cần cài FFmpeg riêng.
- **FR7**: WHEN main process cần gọi FFmpeg (extract-audio, burn-subtitles, reverse-video,
  extract-embedded-subtitles, get video duration), hệ thống SHALL dùng đường dẫn tới binary
  đã bundle thay vì gọi `spawn('ffmpeg', ...)` phụ thuộc PATH hệ thống.
- **FR8**: IF binary FFmpeg đã bundle không tồn tại hoặc không chạy được (ví dụ bị chặn bởi
  antivirus), THEN hệ thống SHALL báo lỗi rõ ràng bằng tiếng Việt cho người dùng, không được
  crash im lặng hoặc treo vô thời hạn.
- **FR9**: Trong môi trường phát triển (`npm run dev`), hệ thống SHALL vẫn dùng được FFmpeg
  đã bundle qua `ffmpeg-static`/tương đương, để dev không cần cài FFmpeg hệ thống để test.

## 4. Yêu cầu phi chức năng (Non-functional Requirements)

- **NFR1 (Không phá vỡ hành vi hiện tại)**: mọi tham số FFmpeg, filter, cách parse progress
  hiện có trong `main/index.ts` SHALL giữ nguyên logic — chỉ thay đường dẫn gọi binary.
- **NFR2 (Kích thước)**: việc thêm FFmpeg binary được chấp nhận làm tăng dung lượng gói cài
  đặt tối đa ~100MB; không cần tối ưu kích thước ở giai đoạn này.
- **NFR3 (Không giảm hiệu năng)**: thời gian xử lý FFmpeg (extract-audio, burn-subtitles...)
  SHALL không chậm hơn đáng kể so với dùng FFmpeg hệ thống hiện tại.
- **NFR4 (Khả năng quan sát)**: mọi lỗi liên quan tới key/FFmpeg SHALL được log ra console
  main process kèm ngữ cảnh đủ để debug, nhưng KHÔNG log giá trị key thật.

## 5. Mô hình dữ liệu liên quan

```ts
// AppSettings (Settings.tsx) — không đổi field, chỉ đổi cách lưu/mặc định
interface AppSettings {
  apiKey: string            // mặc định '', lưu mã hóa qua safeStorage
  baseUrl: string
  elevenLabsApiKey?: string // mặc định '', lưu mã hóa qua safeStorage
  model: string
  systemPrompt: string
  characterContext?: string
  nameDictionary?: string
  subtitleStyle: { ... }    // không đổi
}
```

Cơ chế lưu trữ mới (đề xuất, cần PLAN.md xác nhận chi tiết):
- Thay vì `localStorage.setItem('vietsub_settings', JSON.stringify(settings))` lưu key thô,
  main process expose 2 IPC handler mới: `save-encrypted-setting` / `load-encrypted-setting`
  cho riêng 2 field `apiKey` và `elevenLabsApiKey`; các field còn lại vẫn qua localStorage
  như cũ (không nhạy cảm).

## 6. Xử lý lỗi (Error handling)

| Tình huống | Hành vi mong đợi |
|---|---|
| Người dùng chưa nhập key, bấm chức năng cần key | Giữ nguyên hành vi hiện tại: `alert()` yêu cầu cấu hình key trước |
| `safeStorage` không khả dụng (Linux thiếu keyring) | Cảnh báo, cho phép fallback lưu plaintext có xác nhận (FR4) |
| Binary FFmpeg bundle bị thiếu/hỏng khi chạy | Báo lỗi tiếng Việt rõ ràng: "Không tìm thấy công cụ xử lý video (FFmpeg). Vui lòng cài đặt lại ứng dụng." |
| Key giải mã thất bại (file settings bị hỏng/copy sang máy khác) | Coi như chưa có key, không crash app |

## 7. Tiêu chí chấp nhận (Acceptance Criteria)

- [ ] Không còn chuỗi key thật nào trong `git grep -i "sk-proj\|sk_"` trên toàn bộ `src/`.
- [ ] `DEFAULT_SETTINGS.apiKey` và `.elevenLabsApiKey` là `''`.
- [ ] Key nhập vào Settings, lưu, tắt app, mở lại → key vẫn còn và hoạt động được (test tay).
- [ ] File lưu settings trên đĩa (`app.getPath('userData')`) KHÔNG chứa key dạng plaintext
      đọc được bằng text editor thường.
- [ ] Trên máy **đã gỡ FFmpeg khỏi PATH** (hoặc máy sạch/VM), chạy `npm run build:win` rồi
      cài bản build ra, thực hiện được: tách audio, ghép hardsub, xuất video — không cần cài
      FFmpeg thủ công.
- [ ] `npm run typecheck` và `npm run lint` pass không lỗi mới phát sinh.

## 8. Ranh giới ngoài phạm vi (Out of Scope)
Xem mục "Ngoài phạm vi" trong [`CONTEXT.md`](./CONTEXT.md). Nhắc lại: không refactor
Workspace.tsx, không đổi model AI, không code signing, mac/linux FFmpeg bundle để dành giai
đoạn sau nếu chưa build target các nền tảng đó.
