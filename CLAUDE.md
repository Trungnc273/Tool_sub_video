# CLAUDE.md — Bộ nhớ ngữ cảnh dự án VietSub Pro

> Đọc file này để hiểu nhanh "DNA" của dự án. Cập nhật file này khi có quyết định kiến trúc
> mới hoặc bài học quan trọng — đừng để nó lỗi thời.

## Dự án là gì

Ứng dụng desktop Electron giúp dịch, tạo phụ đề, và lồng tiếng (dubbing) cho video, chủ yếu
phục vụ nội dung tiếng Trung/Anh → tiếng Việt. Xem `REVIEW.md` mục 1.1 để có bảng kiểm kê
tính năng đầy đủ.

Chủ dự án **không rành code** (tự nhận "vibe code"), nên vai trò AI ở đây gần với kỹ sư kiêm
cố vấn kỹ thuật, không chỉ là "công cụ gõ code theo lệnh".

## Kiến trúc hệ thống (tóm tắt)

```
Renderer (React)  <--IPC-->  Main process (Node)  --spawn-->  FFmpeg (external binary)
     |                              |
     |                              +--HTTPS--> OpenAI (Whisper/GPT/TTS)
     |                              +--HTTPS--> ElevenLabs TTS
     |                              +--lib----> edge-tts-ts (Edge TTS)
     |
     +--localStorage--> Project list + settings + subtitle content (JSON stringified)
```

- `src/main/index.ts` (1174 dòng): mọi IPC handler, gọi FFmpeg, gọi API AI, media protocol
  streaming (hỗ trợ HTTP Range).
- `src/preload/index.ts`: expose `window.api.*` cho renderer qua `contextBridge`.
- `src/renderer/src/components/Workspace.tsx` (5475 dòng): màn hình biên tập chính — timeline,
  ASR, dịch, TTS, xuất video. **File này quá lớn, đang trong lộ trình tách nhỏ (xem
  REVIEW.md Giai đoạn 2).**
- `src/renderer/src/utils/srt.ts`: parse/format SRT, model `SubtitleSegment`.

## Quyết định kiến trúc đã có (ADR ngắn gọn)

- **Lưu dữ liệu dự án bằng localStorage, không phải file** — quyết định ban đầu (không rõ lý
  do lịch sử), đang được coi là nợ kỹ thuật cần sửa (giới hạn dung lượng, xem REVIEW.md 3.3).
- **Segments của phụ đề lưu dạng JSON string trong field `srtContent` của Project**, không
  phải file .srt riêng — để giữ toàn bộ state biên tập (offset, translatedText...) không chỉ
  nội dung SRT thuần.
- **Media protocol tùy chỉnh (`media://local/...`)** dùng để stream video local vào thẻ
  `<video>` của renderer, bypass CSP, hỗ trợ Range request — cần thiết vì Electron không cho
  load file:// trực tiếp vào video tag một cách an toàn với contextIsolation bật.

## Bài học kinh nghiệm (Lessons Learned)

1. **Đừng để giá trị mặc định của settings chứa secret thật** — đã xảy ra với API key OpenAI/
   ElevenLabs trong `DEFAULT_SETTINGS` (`Settings.tsx`). Bài học: mọi giá trị mặc định của
   field nhạy cảm phải là chuỗi rỗng.
2. **FFmpeg là external dependency phải bundle**, không giả định người dùng cuối có cài sẵn.
3. **Logic chọn nhà cung cấp TTS (OpenAI/ElevenLabs/Edge) từng bị copy-paste 4 lần** trong
   `main/index.ts` — mỗi lần thêm giọng mới phải nhớ sửa cả 4 chỗ, dễ sót. Bài học: khi thấy
   khối logic lặp ≥3 lần, ưu tiên gom hàm dùng chung ngay, đừng để tích lũy thêm.
4. **UI bộ chọn giọng lồng tiếng bị nhân đôi trong Workspace.tsx** (2 khối JSX gần giống hệt
   nhau ở 2 vị trí khác nhau trong file) — dấu hiệu của việc copy-paste khi thêm tính năng
   panel mới thay vì tái sử dụng component.

## Trạng thái hiện tại (cập nhật 2026-07-02)

- Đã hoàn thành: đánh giá toàn diện code (`REVIEW.md`), thiết lập bộ tài liệu Spec-as-Code.
- Đang chuẩn bị: Giai đoạn 0 — bảo mật key + bundle FFmpeg (xem
  `docs/specs/00-stage0-security-ffmpeg/`).
- Chưa làm: kiểm thử động (chạy thử tính năng với video thật) — xem REVIEW.md phần giới hạn
  đánh giá tĩnh.

## Tham chiếu

- Đánh giá tổng quan & danh sách vấn đề: [`REVIEW.md`](REVIEW.md)
- Luật lệ bất biến: [`CONSTITUTION.md`](CONSTITUTION.md)
- Vai trò/ranh giới AI: [`AGENTS.md`](AGENTS.md)
- Đặc tả từng tính năng: `docs/specs/<tên-tính-năng>/`
