# TASKS.md — Đồng bộ lồng tiếng (spec 05)

- [x] **S1 (FR2).** Lead-in 200ms chuyển từ dữ liệu sang tầng hiển thị:
  - `srt.ts`: bỏ trừ lead-in trong `buildSegmentsFromWords` (seg.start = mốc nói THẬT);
    thêm `displayStart()` + export `SUBTITLE_LEAD_IN_MS`; `stringifySRT` xuất mốc hiển thị.
  - `Workspace.tsx`: `convertToAss` (video xuất) + 2 chỗ chọn overlay preview dùng
    `displayStart` — chữ vẫn hiện sớm 200ms như đã nghiệm thu.
- [x] **S2 (FR4).** `burn-subtitles` lấy mốc lồng tiếng trực tiếp từ `options.segments`
  (bỏ parse ngược file ASS — ASS giờ mang mốc hiển thị, không phải mốc nói).
- [x] **S3 (FR3).** Co giãn atempo HAI CHIỀU theo khung nói thật (`seg.end - seg.start`),
  giới hạn 0.7–1.8, cả 2 đường xuất. Test: TTS 4.0s vào khung 6.0s → atempo 0.7 → 5.70s
  (đo bằng ffmpeg, khớp kỳ vọng 5.71s); chiều nén đã test ở spec 04 (1.672×).
- [x] **S4 (FR1).** Preview prefetch: tải trước audio 3 câu sắp tới khi đang phát;
  `playTtsAudio` ưu tiên audio đã prefetch (phát tức thì từ từ đầu tiên); listener dùng
  `on*` tránh chồng khi tái dùng; map giới hạn 12 mục.
- [x] **V1.** Typecheck pass; lint 152 lỗi nền, không lỗi mới.
- [ ] **V2.** Người dùng nghiệm thu: (a) preview không mất từ đầu câu với các câu đã
  prefetch, (b) video xuất: giọng đọc cùng nhịp lời nhân vật, ngắt nghỉ khớp.

## Lưu ý
Project cũ (tạo trước spec này) có lead-in nằm trong dữ liệu → chạy lại ASR để hưởng
đồng bộ chuẩn. Tempo giới hạn 0.7–1.8 ưu tiên giọng tự nhiên (FR5) — lệch nhỏ còn lại
chỉnh bằng audio offset từng câu.
