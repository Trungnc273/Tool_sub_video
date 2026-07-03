# TASKS.md — Chất lượng lồng tiếng (spec 04)

- [x] **D1 (FR4).** Gộp logic chọn nhà cung cấp/giọng về `synthesizeSpeech` + bảng
  `ELEVEN_VOICE_IDS` khai báo 1 nơi — thay thế 4 khối copy-paste (burn-subtitles,
  export-dubbed-audio, preview-tts-voice, get-tts-audio). Lint giảm 156 → 153 lỗi nền.
- [x] **D2 (FR3).** Cache TTS dùng chung (`getOrSynthesizeTts`, MD5 text+voice+speed,
  `userData/tts_cache`) cho cả 2 đường xuất — trước đây chỉ Nghe thử có cache, mỗi lần
  xuất trả phí lại 100%. Delay chống rate-limit 120ms chỉ áp khi gọi API thật.
- [x] **D3 (FR2).** Tốc độ tự động: ĐO thời lượng thật audio TTS (tái dùng
  `getVideoDuration`) → nén `atempo` đúng tỷ lệ (≤2.0) khi dài hơn slot. Bỏ ước lượng
  `số_từ × 0.4s`. Hoạt động đồng nhất 3 nhà cung cấp (ElevenLabs trước đây bị bỏ qua speed).
  - Test: câu 4.0s vào slot 2.5s → fitTempo 1.672, lời nén nằm gọn trong slot, đủ nội dung.
- [x] **D4 (FR1).** `amix ... normalize=0` + `aresample=44100` cho luồng TTS ở cả 2 filter.
  - Bằng chứng lỗi cũ (peak PCM thô nhạc nền): 370 → 480 → 846 → 1109 (bơm ×3).
  - Sau sửa: 1228 = 1228 = 1228 = 1228 (phẳng tuyệt đối, đúng mức bgVolume).
  - Ghi chú điều tra: `volumedetect` cho số gây hiểu nhầm — phải đo peak PCM thô;
    đã loại giả thuyết dropout_transition/sample-rate/apad trước khi kết luận.
- [x] **V1.** Typecheck pass; lint 153 lỗi (giảm 3 so với nền cũ), không lỗi mới.
- [x] **V2.** E2E scratchpad với FFmpeg bundle + audio giọng thật: bg phẳng, giọng nén
  đúng chỗ, cache hit bỏ delay.
- [ ] **V3.** Người dùng nghiệm thu: xuất video lồng tiếng thật, nghe âm lượng đều,
  lời đủ không đứt; xuất lại lần 2 thấy nhanh rõ rệt (cache).
