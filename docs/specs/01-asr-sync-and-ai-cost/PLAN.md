# PLAN.md — Đồng bộ phụ đề & tối ưu chi phí AI

> Trạng thái: **CHỜ DUYỆT**

## 1. Cách tiếp cận

**Nhánh A — Word-level timestamps (sửa lệch phụ đề):**
1. `main/index.ts` handler `call-whisper-api`: đổi `response_format` từ `srt` sang
   `verbose_json`, thêm `timestamp_granularities[]=word`. Trả về cho renderer object
   `{ words: [{word, start, end}], segments: [...], text }` thay vì chuỗi SRT.
2. Thêm hàm mới trong `srt.ts`: `buildSegmentsFromWords(words)` — ghép từ thành câu theo
   dấu câu (tái dùng quy tắc tách hiện có), mốc start = start của từ đầu câu, end = end của
   từ cuối câu; ép duration tối thiểu 300ms; chống chồng lấn.
3. `Workspace.tsx` `handleRunASR`: nếu kết quả có `words` → dùng `buildSegmentsFromWords`;
   nếu không → parse SRT như cũ (fallback FR3, giữ nguyên code cũ).

**Nhánh B — Prompt dịch gọn + retry bền:**
4. `Workspace.tsx` `handleTranslate`:
   - Format gửi: mỗi dòng `số|câu gốc`, yêu cầu trả `số|câu dịch` (thay JSON).
   - Batch 50 câu; instruction cố định rút còn ~3 câu; giữ nguyên systemPrompt/
     characterContext/nameDictionary của người dùng.
   - Parse bằng regex từng dòng; dòng thiếu → gom lại retry (tối đa 2 lần/lô); lô hỏng
     hẳn → ghi nhận, chạy tiếp lô sau, báo tổng kết cuối.

## 2. File sẽ đổi

| File | Thay đổi |
|---|---|
| `src/main/index.ts` | handler `call-whisper-api`: verbose_json + word granularity |
| `src/preload/index.d.ts` | type trả về mới của `callWhisperApi` |
| `src/renderer/src/utils/srt.ts` | thêm `buildSegmentsFromWords` (thuần, dễ test) |
| `src/renderer/src/components/Workspace.tsx` | `handleRunASR` dùng words; `handleTranslate` format mới + retry |

Không thêm dependency. Không đổi UI.

## 3. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| verbose_json trả payload lớn với video dài (nhiều từ) | Chỉ giữ words trong bộ nhớ lúc build segments, không lưu vào project |
| Tách câu tiếng Trung không có khoảng trắng giữa từ | Whisper trả từng "word" tiếng Trung là cụm ký tự — ghép nguyên văn, tách theo dấu câu `。！？` như cũ |
| Format `số|câu` vỡ nếu câu dịch chứa ký tự `|` | Chỉ split ở dấu `|` đầu tiên mỗi dòng |
| Batch 50 làm 1 lỗi ảnh hưởng nhiều câu hơn | Có retry 2 lần + lô hỏng không chặn lô khác (FR6) |

## 4. Đo lường (NFR2)

Trước khi sửa: chạy script đếm ký tự payload hiện tại trên bộ phụ đề mẫu ~100 câu.
Sau khi sửa: đếm lại cùng bộ. Ghi 2 con số vào TASKS.md. Kỳ vọng giảm ≥25%.

## 5. Câu hỏi cho người dùng

Không có điểm mơ hồ chặn việc — các quyết định kỹ thuật đã nêu rõ ở trên. Chờ duyệt để
sinh TASKS.md và code.
