# SPEC.md — Chất lượng lồng tiếng (spec 04)

## Bằng chứng lỗi (đo được, 2026-07-03)

1. **Âm lượng bơm ×3 theo thời gian** — filter trộn cũ (`amix` normalize mặc định):
   đo peak PCM thô của nhạc nền tại các thời điểm chỉ-có-nhạc: `370 → 480 → 846 → 1109`
   (tăng ×3 trong 20s khi các luồng TTS lần lượt kết thúc). Mức khởi đầu chỉ bằng ~1/3 mức
   bgVolume người dùng đặt. Với `normalize=0`: phẳng tuyệt đối `1228/1228/1228/1228`.
   - Lưu ý điều tra: `volumedetect` cho số liệu gây hiểu nhầm (artifact cửa sổ đo) — phải
     đo bằng peak PCM thô mới ra sự thật. Đã thử và loại các giả thuyết: dropout_transition,
     sample rate mismatch, apad.
2. **Lời bị cắt cụt giữa từ**: `atrim=0:slot` cắt cứng audio TTS tại thời điểm câu sau bắt
   đầu (main/index.ts:627). Tốc độ tự động lẽ ra tránh điều này nhưng dựa trên ước lượng
   `số_từ × 0.4s` (main/index.ts:104) — không phản ánh giọng đọc thật.
3. **Mỗi lần xuất sinh lại TTS toàn bộ**: đường xuất không dùng cache MD5 (đã grep: 0 chỗ),
   trong khi nút Nghe thử có cache. Xuất lại = trả phí lại 100%.
4. **Logic chọn giọng lặp 4 chỗ** (main/index.ts:585, 781, và 2 handler preview/get-tts);
   ElevenLabs bị bỏ qua tham số tốc độ hoàn toàn (payload không có speed).

## Yêu cầu (EARS)

- **FR1**: Hệ thống SHALL trộn âm bằng `amix ... normalize=0` (+ `aresample=44100` cho
  luồng TTS) ở cả 2 đường xuất — âm lượng nền/TTS đúng như 2 thanh chỉnh, không bơm xẹp.
- **FR2**: WHEN bật tốc độ tự động, hệ thống SHALL đo thời lượng THẬT của audio TTS đã sinh
  và WHERE dài hơn khoảng trống, SHALL nén thời gian bằng `atempo` đúng tỷ lệ (tối đa 2.0)
  — không dùng ước lượng đếm từ; áp dụng đồng nhất cho cả 3 nhà cung cấp (kể cả ElevenLabs).
- **FR3**: Đường xuất video và xuất audio SHALL dùng chung cache TTS (MD5 text+voice+speed)
  với nút Nghe thử — chỉ sinh lại câu đã thay đổi.
- **FR4**: Toàn bộ logic chọn nhà cung cấp/giọng SHALL gom về một hàm `synthesizeSpeech`
  duy nhất; bảng map voiceId ElevenLabs khai báo một nơi.
- **FR5**: Hành vi giữ nguyên với người dùng: cùng nút bấm, cùng thanh chỉnh; chỉ kết quả
  ra đúng hơn (không đổi UX).

## Tiêu chí chấp nhận
- [ ] Peak nhạc nền phẳng (±5%) tại mọi cửa sổ chỉ-có-nhạc trong video xuất thử.
- [ ] Câu TTS dài hơn slot: nghe đủ lời (nén tốc độ), không đứt giữa từ.
- [ ] Xuất lần 2 cùng nội dung: 0 lời gọi API TTS (toàn bộ cache hit, xác nhận qua log).
- [ ] Typecheck + lint pass; người dùng nghiệm thu video lồng tiếng thật.
