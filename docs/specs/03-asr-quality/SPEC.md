# SPEC.md — Chất lượng ASR: đầy đủ, đúng lời, kể cả video khó (nhạc nền/tạp âm)

## Bối cảnh
Chủ dự án chốt ưu tiên (2026-07-03): **chất lượng trích xuất lời trước, tối ưu token sau**.
Yêu cầu: không bỏ sót lời nhân vật, đúng nội dung kể cả khi nhiều nhạc nền/tạp âm, phụ đề
khớp lời nói. Rà soát tìm thấy 4 điểm yếu (xem bảng trong PLAN thảo luận / commit message).

## Yêu cầu (EARS)

- **FR1**: Hệ thống SHALL trích audio ở bitrate cố định 64kbps 16kHz mono (không còn hạ
  xuống 16-48kbps theo độ dài video) — chất lượng đầu vào Whisper không phụ thuộc độ dài.
- **FR2**: Hệ thống SHALL áp bộ lọc tăng cường giọng nói khi trích audio: highpass 70Hz
  (cắt ù/bass nhạc nền) + loudnorm (chuẩn hóa âm lượng, kéo giọng nhỏ lên).
- **FR3**: WHEN file audio vượt 24MB (giới hạn Whisper 25MB), hệ thống SHALL tự chia thành
  các khúc ~10 phút, gọi Whisper từng khúc, và ghép kết quả với mốc thời gian được cộng
  offset chính xác — video dài bất kỳ vẫn đủ lời, không giảm bitrate, không lỗi.
- **FR4**: WHEN chuyển ngữ theo khúc, hệ thống SHALL gửi tiến độ về renderer để người dùng
  thấy đang xử lý khúc mấy/tổng số.
- **FR5**: Prompt mồi Whisper SHALL trung tính (chỉ làm mẫu ngắt câu, không chứa nội dung
  chủ đề cụ thể), và WHERE người dùng có Từ điển tên riêng, hệ thống SHALL đưa các tên
  gốc vào prompt (tối đa ~120 ký tự) để Whisper nghe/viết đúng tên nhân vật.
- **FR6**: `buildSegmentsFromWords` SHALL resync con trỏ từ tại ranh giới mỗi segment
  (bỏ qua từ thừa của segment trước) — lệch cục bộ không lan dây chuyền.

## Tiêu chí chấp nhận
- [ ] Audio test có nhạc nền: transcript đầy đủ các câu thoại (test bằng audio trộn
      giọng + nhạc, đối chiếu từng câu).
- [ ] File audio giả lập >24MB: tự chia khúc, mốc thời gian các câu ở khúc 2+ đúng offset.
- [ ] Prompt zh không còn nội dung câu cá; tên trong Từ điển xuất hiện trong prompt.
- [ ] Typecheck + lint pass, không lỗi mới.
- [ ] Người dùng nghiệm thu trên video thật khó (nhạc nền) trước khi build phát hành.
