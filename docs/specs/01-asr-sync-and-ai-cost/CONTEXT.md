# CONTEXT.md — Đồng bộ phụ đề với lời nói & tối ưu chi phí AI

## Nỗi đau thực tế (ghi nhận từ chủ dự án, 2026-07-03, sau khi test app thật)

1. **Phụ đề không khớp lời nói**: chữ hiện chậm hơn nhân vật nói, và hiện thành từng cụm
   dài thay vì từng câu ngắn khớp nhịp thoại.
2. **Chi phí AI**: tính năng ASR + dịch dùng API trả tiền; muốn tiết kiệm token nhưng vẫn
   giữ chất lượng dịch và tốc độ xử lý.

## Nguyên nhân gốc (đã xác minh trong code)

- `main/index.ts` gọi Whisper với `response_format: 'srt'` → chỉ nhận mốc thời gian theo
  **đoạn dài** (segment-level).
- `srt.ts` hàm `splitSegment` (dòng 124-174) tách đoạn dài thành câu nhưng **chia thời gian
  theo tỷ lệ số ký tự** (dòng 152) — không phản ánh thời điểm nói thật (ngừng nghỉ, tốc độ
  nói không đều) → phụ đề lệch.
- Dịch GPT (`Workspace.tsx:2396`): mỗi lô 25 câu lặp lại toàn bộ system prompt + hướng dẫn
  + từ điển; payload JSON dài dòng → tốn token không cần thiết.

## Ràng buộc & giả định

- Whisper API tính tiền theo **phút audio**, không theo token → lấy word-level timestamps
  không tăng chi phí ASR.
- Chi phí dịch GPT tính theo token vào/ra → giảm token prompt lặp lại và format gọn là
  hướng tiết kiệm chính; **không hy sinh chất lượng dịch** (không đổi sang model kém hơn
  khi chưa đo được chất lượng).
- Giữ nguyên model `SubtitleSegment` và luồng biên tập hiện có — chỉ đổi cách sinh dữ liệu
  đầu vào (timestamps chuẩn hơn) và cách đóng gói lời gọi dịch.

## Ngoài phạm vi

- Không stream kết quả dịch theo thời gian thực (để giai đoạn sau).
- Không thêm lựa chọn model ASR khác (whisper-1 giữ nguyên).
- Không xử lý audio > 25MB (giới hạn Whisper) trong spec này — đã ghi nhận ở REVIEW.md 4.8.
