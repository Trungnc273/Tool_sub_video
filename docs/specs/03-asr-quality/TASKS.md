# TASKS.md — Chất lượng ASR (spec 03)

> Ưu tiên chủ dự án chốt: chất lượng trích xuất trước, tối ưu sau.

- [x] **Q1.** Bỏ bóp bitrate theo độ dài (16-48k → cố định 64k) — `main/index.ts` extract-audio.
- [x] **Q2.** Bộ lọc tăng cường giọng nói: `highpass=f=70` + `loudnorm` — test audio trộn
  nhạc nền: transcript 5/5 câu đúng từng chữ (bộ lọc không gây hại; phát huy với nhạc thật
  có bass mạnh).
- [x] **Q3.** Chia khúc audio >24MB với **chồng lấn 5s + khử trùng lặp theo vùng sở hữu**.
  - Đã thử phương án dò-im-lặng trước: THẤT BẠI với nhạc nền liên tục (0 khoảng lặng) —
    đây chính là trường hợp khó người dùng cần. Chuyển sang overlap.
  - Test thật (khúc 10s + overlap 3s trên audio 16s có nhạc nền): câu vắt ranh giới
    "Nước dùng phải trong và ngọt tự nhiên" — cắt cứng làm mất chữ ("Nước dùng tương tự"),
    overlap cho lại **nguyên vẹn 5/5 câu, không trùng lặp**.
- [x] **Q4.** Tiến độ theo khúc gửi về renderer (`whisper-chunks`) — video dài thấy % rõ.
- [x] **Q5.** Prompt ASR trung tính (bỏ nội dung câu cá gây thiên vị) + bơm tên riêng từ
  Từ điển người dùng vào prompt Whisper (≤120 ký tự).
- [x] **Q6.** Resync con trỏ từ tại ranh giới segment trong `buildSegmentsFromWords` —
  lệch cục bộ không lan dây chuyền.
- [x] **V1.** Typecheck pass; lint 156 lỗi nền, không lỗi mới.
- [ ] **V2.** Người dùng nghiệm thu trên video thật nhiều nhạc nền.
