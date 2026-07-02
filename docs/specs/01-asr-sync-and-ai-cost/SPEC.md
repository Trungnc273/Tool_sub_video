# SPEC.md — Đồng bộ phụ đề với lời nói & tối ưu chi phí AI

## 1. Bối cảnh
Xem [`CONTEXT.md`](./CONTEXT.md). Hai mục tiêu: (A) phụ đề khớp thời điểm nói thật,
(B) giảm token dịch mà không giảm chất lượng.

## 2. Tác nhân
- Người dùng chạy ASR và dịch trong Workspace.
- OpenAI Whisper API (ASR) và GPT API (dịch).

## 3. Yêu cầu chức năng (EARS)

### A. Đồng bộ phụ đề (word-level timestamps)

- **FR1**: WHEN người dùng chạy ASR, hệ thống SHALL gọi Whisper với `response_format:
  'verbose_json'` và `timestamp_granularities: ['word']` để nhận mốc thời gian từng từ.
- **FR2**: Hệ thống SHALL tách kết quả ASR thành từng câu theo dấu câu (giữ quy tắc tách
  hiện có: `。！？.!?` rồi tới phẩy nếu câu quá dài), và mốc start/end của mỗi câu SHALL lấy
  từ **thời điểm thật của từ đầu tiên và từ cuối cùng** trong câu đó, không nội suy theo độ
  dài chữ.
- **FR3**: WHERE kết quả Whisper không có dữ liệu từng từ (API đổi hành vi/lỗi), hệ thống
  SHALL fallback về luồng cũ (segment-level + chia theo tỷ lệ chữ) và vẫn ra phụ đề, không
  báo lỗi chết.
- **FR4**: Mốc thời gian câu SHALL không chồng lấn nhau (end câu trước ≤ start câu sau) và
  mỗi câu có duration tối thiểu 300ms để người xem kịp đọc.

### B. Tối ưu token dịch

- **FR5**: Hệ thống SHALL gửi dữ liệu dịch dạng danh sách đánh số gọn (`1|câu gốc`) thay vì
  JSON object, và yêu cầu trả về cùng format (`1|câu dịch`), parse bằng regex an toàn.
- **FR6**: WHEN một lô trả về thiếu dòng hoặc sai format, hệ thống SHALL retry lô đó tối đa
  2 lần trước khi báo lỗi cho riêng lô đó (các lô khác vẫn tiếp tục) — sửa luôn vấn đề
  REVIEW.md 4.1 (một lô hỏng làm chết cả tiến trình dịch).
- **FR7**: Cỡ lô mặc định SHALL tăng lên 50 câu (từ 25) để giảm số lần lặp prompt; phần
  hướng dẫn cố định trong prompt SHALL được rút gọn tối đa nhưng giữ nguyên: system prompt
  người dùng cấu hình, ngữ cảnh nhân vật, từ điển tên riêng (đây là phần quyết định chất
  lượng, không cắt).
- **FR8**: Hệ thống SHALL giữ model dịch cấu hình được như hiện tại (mặc định gpt-4o-mini,
  không đổi trong spec này).

## 4. Phi chức năng

- **NFR1**: Chất lượng dịch không giảm — system prompt/ngữ cảnh/từ điển giữ nguyên đầy đủ.
- **NFR2**: Tổng token gửi đi cho cùng một video giảm ≥25% so với hiện tại (đo bằng đếm
  ký tự payload trước/sau trên cùng bộ phụ đề mẫu).
- **NFR3**: Không đổi UX: người dùng vẫn bấm "Chạy ASR" và "Dịch AI" như cũ.

## 5. Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Whisper không trả `words` | Fallback luồng cũ (FR3), log cảnh báo |
| Lô dịch trả sai format sau 2 retry | Đánh dấu các câu lô đó chưa dịch, tiếp tục lô sau, cuối cùng báo "X/Y câu chưa dịch được, bấm Dịch AI để thử lại" |
| Audio quá 25MB | Giữ hành vi hiện tại (ngoài phạm vi) |

## 6. Tiêu chí chấp nhận

- [ ] Chạy ASR trên video thật có thoại: mốc thời gian mỗi câu khớp lời nói (chủ dự án
      nghiệm thu bằng mắt/tai trên video của họ).
- [ ] Câu phụ đề ngắn theo câu nói, không còn cụm dài bất thường.
- [ ] Dịch cùng một video: payload token giảm ≥25% (đo và ghi số liệu vào TASKS.md).
- [ ] Một lô dịch cố tình lỗi không làm chết toàn bộ tiến trình dịch.
- [ ] Typecheck + lint pass, không lỗi mới.
