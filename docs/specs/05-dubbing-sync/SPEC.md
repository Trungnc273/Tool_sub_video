# SPEC.md — Đồng bộ lồng tiếng với lời nói nhân vật (spec 05)

## Bối cảnh (từ test thực tế của chủ dự án, 2026-07-03)
- Xuất video: lồng tiếng đạt 85-90% nhưng tốc độ đọc ≠ tốc độ nói, ngắt nghỉ lệch.
- Preview (edit): giọng phát chậm, mất 2-3 từ đầu câu.

## Nguyên nhân đã xác minh
1. Preview chuẩn bị audio KHI câu đã bắt đầu (IPC sinh/tải 0.5-3s) → trễ vượt ngưỡng 800ms
   → bộ chống-lệch seek tới → nuốt từ đầu câu. Bản chất: thiếu cơ chế tải trước.
2. Xuất: tempo chỉ nén một chiều khi tràn slot; nhân vật nói chậm → TTS đọc xong sớm,
   nhịp lệch. TTS đặt tại mốc phụ đề (đã gồm lead-in 200ms) → giọng cất lên trước khi
   nhân vật mở miệng.
3. Lead-in 200ms đang nướng vào dữ liệu (seg.start) thay vì tầng hiển thị.

## Yêu cầu (EARS)

- **FR1**: WHEN đang phát với thuyết minh bật, hệ thống SHALL tải trước audio của tối đa
  3 câu sắp tới; WHEN câu đến lượt, audio SHALL phát ngay từ từ đầu tiên (không seek bỏ chữ).
- **FR2**: Dữ liệu segment SHALL lưu mốc nói THẬT (word timestamps); hiệu ứng hiện-sớm
  200ms SHALL áp ở tầng hiển thị (overlay preview + ASS/SRT xuất ra), không đổi dữ liệu.
- **FR3**: WHEN xuất có lồng tiếng và bật tốc độ tự động, mỗi câu TTS SHALL được co/giãn
  atempo HAI CHIỀU (giới hạn 0.7–1.8) để thời lượng đọc khớp khung nói thật của câu
  (seg.end - seg.start); giọng đặt tại seg.start (đúng lúc nhân vật nói).
- **FR4**: Mốc thời gian lồng tiếng SHALL lấy trực tiếp từ segments (không parse ngược từ
  file ASS hiển thị) — tách bạch dữ liệu nói và dữ liệu hiển thị.
- **FR5**: Giới hạn co giãn ưu tiên độ tự nhiên của giọng (0.7–1.8); khớp tuyệt đối không
  phải mục tiêu — phần lệch còn lại người dùng chỉnh audio offset từng câu (đã có).

## Lưu ý tương thích
Project cũ tạo trước spec này có lead-in nằm trong dữ liệu → lồng tiếng sẽ sớm ~200ms;
chạy lại ASR để nhận dữ liệu chuẩn mới.

## Tiêu chí chấp nhận
- [ ] Preview: câu đã cache phát ngay từ từ đầu tiên; không nuốt từ với các câu đã prefetch.
- [ ] Xuất: đo mốc bắt đầu/kết thúc giọng đọc khớp khung nói (±10%) với câu test.
- [ ] Phụ đề hiển thị vẫn hiện sớm 200ms như đã nghiệm thu (preview + video xuất).
- [ ] Typecheck + lint pass; người dùng nghiệm thu video thật.
