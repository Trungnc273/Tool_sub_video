# TASKS.md — Đồng bộ phụ đề & tối ưu chi phí AI

> Sinh từ PLAN.md đã duyệt (2026-07-03).

## Nhánh A — Word-level timestamps

- [x] **A1.** `main/index.ts`: `call-whisper-api` chuyển sang `verbose_json` +
  `timestamp_granularities[]=word`, trả object `{text, words, segments}`.
  - DoD ✅: API thật trả 25 words có start/end cho audio giọng nói 9s.
- [x] **A2.** `srt.ts`: thêm `buildSegmentsFromWords(words, segments)` — tách câu theo dấu
  câu (quy tắc cũ), căn thời gian theo từ thật; min duration 300ms; chống chồng lấn;
  fallback tỷ lệ chữ khi thiếu words.
  - DoD ✅: test bằng words thật (compile chính srt.ts bằng esbuild) — 4 câu tách đúng,
    mốc thời gian phản ánh khoảng nghỉ thật giữa câu (1.22s→2.50s), điều nội suy cũ không làm được.
- [x] **A3.** `Workspace.tsx` `handleRunASR`: dùng `buildSegmentsFromWords` khi có words,
  fallback parseSRT khi không. Cập nhật type `callWhisperApi` trong `index.d.ts`.
  - DoD ✅: typecheck pass.

## Nhánh B — Prompt dịch gọn + retry

- [x] **B1.** `Workspace.tsx` `handleTranslate`: format `số|câu`, batch 50, instruction rút
  gọn (giữ nguyên systemPrompt/characterContext/nameDictionary), parse regex, retry dòng
  thiếu tối đa 2 lần/lô, lô hỏng không chặn lô khác, tổng kết câu chưa dịch cuối tiến trình.
  Bổ sung: bấm "Dịch AI" khi còn câu thiếu → chỉ dịch câu thiếu (không tốn token dịch lại);
  tất cả đã dịch → dịch lại toàn bộ.
  - DoD ✅: GPT thật trả đúng format 4/4 dòng tiếng Trung → Việt, regex parse 100%.
- [x] **B2.** Đo token payload trước/sau trên bộ phụ đề mẫu 100 câu (~25-40 ký tự/câu):
  - Trước: **7.855 ký tự** (4 lô × 25 câu, JSON) | Sau: **4.191 ký tự** (2 lô × 50, `số|câu`)
  - **Giảm 47% input** (mục tiêu ≥25% ✅); phần bao bọc output giảm ~91%
    (JSON `{"index":N,"translatedText":"..."}` → `N|...`).

## Kiểm tra chấp nhận

- [x] **V1.** Typecheck pass; lint giữ nguyên 156 lỗi nền của code cũ, không lỗi mới.
- [x] **V2.** (AI test, 2026-07-03) E2E bằng API thật: Edge TTS sinh giọng Việt 4 câu →
  Whisper word-level → `buildSegmentsFromWords` (code thật, compile esbuild) ra 4 câu khớp
  mốc thời gian → GPT dịch format mới parse 4/4. Toàn bộ PASS.
- [ ] **V3.** (Người dùng nghiệm thu) Phụ đề khớp lời nói trên video thực tế của chủ dự án.
