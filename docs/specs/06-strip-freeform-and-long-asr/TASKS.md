# TASKS.md — Dải nền tự do vị trí/màu + chống thiếu phụ đề video dài (spec 06)

## Phần A — Dải nền che sub: vị trí/màu/kích thước tự do

- [x] **A1.** Settings.tsx: thêm `bgStripPosX`, `bgStripWidth`, `bgStripColor`,
  `bgStripOpacity` vào type + default (100/50/`#15151d`/60).
- [x] **A2.** `convertToAss`: thêm `hexOpacityToAss()`; bỏ full-width cố định, tính
  leftX/rightX theo posX/width; màu+alpha tùy chỉnh thay `&H0D000000` cố định; `\blur4`
  cho viền mềm.
- [x] **A3.** Preview: overlay dải nền dùng posX/width/color/opacity thật;
  `backdrop-filter: blur(6px)` cho preview; kéo trực tiếp (mousedown/move/up, lưu 1 lần
  lúc thả — cùng cơ chế spec 02); `pointerEvents: auto` để nhận chuột qua container cha.
- [x] **A4.** Bảng điều khiển: 4 thanh trượt (dọc/ngang/cao/rộng, đều 0-100% hoặc 1-100%)
  + color picker + opacity slider.
- [x] **V-A1.** Render frame thật qua FFmpeg (màu xanh 60% alpha, lệch trái, `\blur4`):
  xác nhận trực quan đúng vị trí/màu/viền mềm — ảnh đính kèm trong hội thoại.
- [x] **V-A2.** Toán tọa độ/màu kiểm bằng tay: center X=384px (30% của 1280), center
  Y=576px (20% từ dưới của 720), alpha 60%→`&H66`. Khớp code.

## Phần B — Video 10-20 phút thiếu phụ đề

### Quá trình điều tra (ghi lại để tránh lặp sai lầm)

- [x] **B1.** Tính toán: audio 20 phút @ 64kbps ≈ 9.8MB — dưới xa ngưỡng chia khúc cũ
  (24MB, kích hoạt ~50 phút). Xác nhận: video 10-20 phút KHÔNG hề qua cơ chế chia khúc.
- [x] **B2.** Test lần 1 (nội dung LẶP — 480 câu cùng 1 mẫu câu): phát hiện gọi nguyên
  khối 26 phút bị `UND_ERR_HEADERS_TIMEOUT` (timeout mạng 5 phút mặc định của Node/undici)
  — lỗi thật nhưng khác mô tả "thiếu âm thầm" của người dùng.
- [x] **B3.** Test lần 2 (vẫn nội dung lặp, cắt 15 phút): thiếu 123/328 câu ở nguyên khối,
  và **chia khúc cho kết quả giống hệt** (122/328 thiếu) — chỉ ra nội dung lặp y hệt kích
  hoạt cơ chế "phát hiện lặp" riêng của Whisper, không phản ánh video thật. **Loại bỏ
  phương pháp test này.**
- [x] **B4.** Test lần 3 (nội dung ĐA DẠNG — 10 mẫu câu xoay vòng, 15 phút thật):
  - Gọi nguyên khối 1 lần: thiếu **15/205 câu (7.3%)**, gồm cụm liền tới 6 câu
    (74; 119-124; 143-144; 179-184).
  - Chia khúc 2×~7.5 phút (overlap 5s, đúng logic ghép của app): thiếu **2/205 câu (~1%)**.
  - **Kết luận: chia khúc giảm tỷ lệ thiếu ~7 lần.** Đây là bằng chứng đủ để sửa.

### Sửa

- [x] **B5.** `call-whisper-api`: đo `totalDuration` LUÔN (không chỉ khi vượt dung
  lượng); kích hoạt chia khúc khi `size > 24MB` **HOẶC** `duration > CHUNK_SECONDS`.
  Giảm `CHUNK_SECONDS` từ 600 xuống **480s (8 phút)** — khớp với độ dài khúc đã kiểm
  chứng hiệu quả trong test B4.
- [x] **V-B1.** Typecheck pass; lint không lỗi mới.
- [ ] **V-B2.** Người dùng nghiệm thu: chạy ASR trên video thật 10-20 phút, so sánh số
  câu/độ đầy đủ trước và sau bản cập nhật.

## Ghi chú quan trọng cho lần điều tra sau
Test với nội dung TTS lặp lại y hệt (dù chỉ đổi số) tạo ra artifact riêng của Whisper
(nghi ngờ là cơ chế chống lặp/phát hiện im lặng) khiến kết quả không phản ánh đúng hành
vi với video thật. Luôn dùng nội dung có văn phong đa dạng khi kiểm thử ASR.
