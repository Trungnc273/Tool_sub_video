# SPEC.md — Dải nền che sub tự do vị trí/màu + chống thiếu phụ đề video dài

## Phần A: Dải nền che sub gốc — không giới hạn, không đen, có thể chỉnh

### Bằng chứng hiện trạng (trước sửa)
- Vị trí Y giới hạn 2-50%, không có vị trí X (luôn full-width) — `Workspace.tsx:3567` (cũ).
- Màu cố định `&H0D000000` (đen, alpha 0D ≈ 95% đục) hard-code trong ASS style —
  `Workspace.tsx:389` (cũ), không có input màu/opacity.
- Preview cùng vấn đề: `background: '#0a0a0f', opacity: 0.95` cố định.

### Yêu cầu
- **FR1**: Vị trí (X, Y) và kích thước (rộng, cao) của dải nền SHALL không giới hạn phạm vi
  hợp lý (0-100%), chỉnh được bằng thanh trượt hoặc kéo trực tiếp trên preview.
- **FR2**: Màu và độ trong suốt SHALL tùy chỉnh được (color picker + slider opacity),
  không cố định đen.
- **FR3**: Dải nền SHALL có viền mờ (frosted) thay vì cạnh sắc — dùng `\blur` trong ASS khi
  xuất, `backdrop-filter: blur()` khi preview.
- **FR4**: Kéo dải nền trên preview SHALL chỉ lưu 1 lần lúc thả chuột (không spam re-render),
  cùng cơ chế đã dùng cho kéo phụ đề (spec 02).

### Bằng chứng đã sửa (render test bằng FFmpeg thật)
Dựng file `.ass` với màu xanh `#2288FF` alpha 60%, vị trí lệch trái (không full-width),
`\blur4` — burn vào frame test, xác nhận trực quan: dải nền lệch trái đúng vị trí, màu xanh
trong suốt (không đen), viền mờ mềm (không sắc cạnh). Tọa độ tính tay khớp với code:
center X=384px (30% của 1280), center Y=576px (20% từ dưới của 720) — đúng công thức.

## Phần B: Video 10-20 phút vẫn thiếu phụ đề

### Chẩn đoán (cần xác nhận bằng đo thật trước khi kết luận)
Audio 20 phút ở bitrate 64kbps ≈ 9.8MB — **thấp hơn nhiều** ngưỡng chia khúc hiện tại
(24MB, kích hoạt ở ~50 phút). Nghĩa là video 10-20 phút được gửi lên Whisper trong **một
lần gọi API duy nhất, không hề đi qua cơ chế chia khúc đã xây ở spec 03**.

Giả thuyết: đây là giới hạn đã biết của endpoint Whisper API khi xử lý audio dài trong một
lần gọi (suy giảm/rớt nội dung tăng dần theo thời lượng, độc lập với code của app) — không
phải lỗi trong logic ghép/tách câu của app.

### Kiểm chứng
Sinh audio tiếng Việt ~16 phút gồm N câu đánh số riêng biệt (không thể nhầm lẫn), chạy qua
Whisper API thật ở 2 chế độ: (a) gọi nguyên khối 1 lần, (b) chia khúc chồng lấn theo cơ chế
đã có ở spec 03 nhưng hạ ngưỡng theo **thời lượng** thay vì chỉ theo dung lượng. Đếm số câu
bị thiếu ở mỗi chế độ.

### Yêu cầu
- **FR5**: Hệ thống SHALL kích hoạt cơ chế chia khúc chồng lấn (đã có, spec 03) khi audio
  vượt ngưỡng **thời lượng** (không chỉ dung lượng) — áp dụng cho video dài dù dung lượng
  còn nhỏ.
- **FR6**: Ngưỡng thời lượng SHALL đặt ở mức thấp hơn điểm bắt đầu suy giảm chất lượng quan
  sát được qua kiểm chứng thực tế (mục tiêu ban đầu: 8 phút/khúc).

## Tiêu chí chấp nhận
- [ ] Dải nền: kéo được tới mọi vị trí, đổi màu/độ trong suốt, xuất video giữ đúng vị trí/màu.
- [ ] Video dài 10-20 phút: số câu bị thiếu sau khi chia khúc theo thời lượng giảm rõ rệt so
      với gọi nguyên khối (đo bằng bộ test đếm câu số).
- [ ] Typecheck + lint pass, không lỗi mới.
