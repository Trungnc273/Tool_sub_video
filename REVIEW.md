# Đánh giá dự án VietSub Pro & Lộ trình cải tiến

> Ngày đánh giá: 2026-07-02
> Mục tiêu sản phẩm: **Phát hành cho người dùng khác cài đặt** (không chỉ dùng cá nhân).
> Phương pháp: đánh giá dựa trên đọc toàn bộ mã nguồn, mọi kết luận đều kèm bằng chứng `file:dòng`.

---

## 1. Dự án là gì

Ứng dụng **desktop Electron + React + TypeScript** để **dịch, tạo phụ đề và lồng tiếng** cho video. Luồng nghiệp vụ:

1. Chọn video → tách audio bằng FFmpeg — `Dashboard.tsx:32`
2. Nhận diện giọng nói (ASR) qua **OpenAI Whisper** → phụ đề — `Workspace.tsx:2349`
3. Dịch sang tiếng Việt qua **GPT**, xử lý theo lô 25 câu — `Workspace.tsx:2396`
4. Lồng tiếng (TTS): OpenAI / ElevenLabs / Edge-TTS — `main/index.ts:189-374`
5. Ghép phụ đề cứng + trộn giọng lồng vào video bằng FFmpeg — `main/index.ts:377`

**Cấu trúc file nguồn:**

| File | Số dòng | Vai trò |
|---|---|---|
| `src/renderer/src/components/Workspace.tsx` | 5.475 | Toàn bộ màn hình biên tập (God Component) |
| `src/main/index.ts` | 1.174 | Main process: IPC, FFmpeg, gọi API TTS/Whisper/GPT |
| `src/renderer/src/components/Settings.tsx` | 491 | Cấu hình |
| `src/renderer/src/components/Dashboard.tsx` | 358 | Danh sách/khởi tạo dự án |
| `src/renderer/src/App.tsx` | 256 | Khung điều hướng |
| `src/renderer/src/utils/srt.ts` | 191 | Parse/format phụ đề |

**Nhận định tổng quan:** ý tưởng và phạm vi tính năng tốt, sản phẩm đã chạy end-to-end. Vấn đề nằm ở **tổ chức code và một số rủi ro chặn phát hành**, không phải ở nghiệp vụ. Vì đã chạy được, hướng đúng là **refactor dần, không viết lại từ đầu**.

### 1.1. Kiểm kê tính năng đầy đủ (đã quét toàn bộ mã nguồn)

**Tạo phụ đề:**
- Nhận diện giọng nói (ASR) qua Whisper, chọn ngôn ngữ zh/en/vi/auto + prompt mồi — `Workspace.tsx:2349`
- Trích xuất phụ đề nhúng (soft-sub) từ video — `Workspace.tsx:3009`, `main/index.ts:998`
- Tự tách câu theo dấu câu sau ASR — `srt.ts:107`
- ⚠️ **KHÔNG có** import file .srt/.ass từ ngoài (lỗ hổng tính năng)

**Dịch:**
- Dịch AI theo lô 25 câu qua GPT — `Workspace.tsx:2396`
- System prompt + ngữ cảnh nhân vật + từ điển tên riêng tùy chỉnh — `Settings.tsx`
- Tra Hán-Việt từng câu qua GPT — `Workspace.tsx:838`
- Sửa lỗi font mojibake tự động (healer) — `Workspace.tsx:28, 583`

**Biên tập phụ đề:**
- Timeline: zoom, kéo clip, kéo mép trim từng clip, xếp lane cho phụ đề chồng nhau — `Workspace.tsx:403, 1388`
- Thêm / xóa / gộp câu chồng lấn / tách câu tại playhead (phím B) — `:2147, 2204, 2267`
- Undo/redo — `:2108`
- Tìm & thay thế hàng loạt (whole-word, phân biệt hoa/thường, chỉ dòng chọn) — `:1004`
- Modal tìm kiếm/lọc kéo được — `:772`
- Time shift toàn bộ; audio offset toàn cục & từng câu — `:2468`
- Phím tắt: Space, 1/2, mũi tên (tua), Shift+mũi tên, B, Tab, Ctrl+Z/Y — `:1817`

**Lồng tiếng (TTS):**
- 3 nhà cung cấp: OpenAI (9 giọng), ElevenLabs (5 giọng), Edge-TTS (2 giọng Việt) — `main/index.ts:189-374`
- Nghe thử giọng có cache; cache TTS theo MD5 — `main/index.ts:907, 953`
- Tốc độ đọc thủ công + tự động theo độ dài câu — `main/index.ts:93`
- Điều chỉnh âm lượng gốc / âm lượng TTS — `App.tsx`

**Video & Xuất:**
- Biến đổi: lật ngang/dọc, xoay 90/180/270, phông xanh, phát ngược — `Workspace.tsx:471`, `main/index.ts:1036`
- Style phụ đề ASS: cỡ chữ, màu, viền, dải nền, vị trí X/Y — `Workspace.tsx:326`
- Trim đầu/cuối khi xuất — `main/index.ts:389`
- 3 chế độ xuất: hardsub / lồng tiếng vào video / chỉ audio — `Workspace.tsx:731`
- Xuất SRT / TXT / ASS / VTT — `main/index.ts:808`
- Streaming video local qua media protocol (HTTP Range) — `main/index.ts:1090`

---

## 2. Lỗi chặn phát hành (BẮT BUỘC xử lý trước khi phát hành)

### 🔴 A. API key thật bị hard-code trong mã nguồn
`Settings.tsx:27-29` để **key OpenAI và ElevenLabs thật** làm giá trị mặc định:

```
apiKey: 'sk-proj--Oz_Y04N...'          // OpenAI
elevenLabsApiKey: 'sk_70bf10b1...'      // ElevenLabs
```

- **Hệ quả:** mọi bản build/cài đặt đều lộ key này; ai cũng có thể tiêu tiền trên tài khoản của bạn. Key đã nằm trong source coi như đã lộ vĩnh viễn.
- Key còn được lưu tiếp vào `localStorage` dạng plaintext — `App.tsx:54`.
- **Hành động:** (1) **Revoke ngay** cả 2 key trên dashboard OpenAI/ElevenLabs; (2) xóa khỏi `DEFAULT_SETTINGS`; (3) lưu key người dùng nhập bằng `safeStorage` của Electron (mã hóa theo máy) thay vì localStorage.

### 🔴 B. FFmpeg không được đóng gói
App gọi `spawn('ffmpeg', ...)` — giả định FFmpeg có sẵn trong PATH (`main/index.ts:64, 142, 585, 1002, 1050`). `electron-builder.yml` **không** bundle FFmpeg.

- **Hệ quả:** máy dev chạy được vì có cài FFmpeg; **máy người dùng cuối sẽ lỗi ngay bước tách audio**. Với mục tiêu phát hành, đây là lỗi chặn.
- **Hành động:** dùng `ffmpeg-static` (hoặc kèm binary trong `resources/`), và trỏ `spawn` tới đường dẫn binary đã bundle thay vì tên `'ffmpeg'` trần.

### 🔴 C. Không kèm giấy phép / thông tin nhà phát hành
`package.json` còn để `author: "example.com"`, `homepage: electron-vite.org` — thông tin mẫu. Cần sửa trước khi phát hành để tránh hiểu nhầm và để `electron-builder` ký/đóng gói đúng.

---

## 3. Vấn đề kiến trúc (nợ kỹ thuật lớn)

### 3.1. `Workspace.tsx` — God Component 5.475 dòng
Một component chứa: **49 `useState`**, **12 `useEffect`**, hơn **35 handler**, toàn bộ logic ASR / dịch / TTS / timeline / xuất file.

- **Bằng chứng:** `Workspace.tsx:2349` (ASR), `:2396` (dịch), `:2487` (TTS), `:2550` (hardsub), `:1388` (kéo clip timeline) — tất cả trong một file.
- **Hệ quả thực tế:**
  - 49 state cùng một component → gõ 1 ký tự re-render toàn bộ timeline → **lag khi phụ đề dài**.
  - Sửa 1 tính năng phải cuộn qua ngàn dòng, dễ vỡ chỗ khác.
  - Không viết được test, không tái sử dụng.
- **Hướng:** tách thành hook + component con (chi tiết ở Mục 5, Giai đoạn 2).

### 3.2. Logic chọn giọng/TTS bị lặp 4 lần
Khối "phân loại voice (OpenAI/ElevenLabs/Edge) + map voiceId + gọi API" bị **copy-paste ở 4 nơi**:
`main/index.ts:510-531`, `:705-726`, `:925-941`, `:972-988`.

- **Hệ quả:** sửa 1 bug (ví dụ thêm giọng mới, đổi model) phải sửa 4 chỗ, dễ sót.
- **Hướng:** gom thành 1 hàm `synthesizeSpeech(text, voice, opts)` duy nhất ở main process.

### 3.3. Lưu trữ toàn bộ dữ liệu trong `localStorage`
Cả danh sách dự án lẫn **nội dung phụ đề** (JSON) đều nằm trong localStorage: `App.tsx:18, 48`, `Workspace.tsx:2104` (`srtContent: JSON.stringify(healed)`).

- **Hệ quả:** localStorage giới hạn ~5–10MB. Nhiều dự án hoặc phụ đề dài sẽ **vượt hạn mức và mất dữ liệu âm thầm**, không báo lỗi.
- **Hướng:** lưu mỗi dự án thành file JSON trong `app.getPath('userData')`.

---

## 4. Vấn đề độ ổn định & chất lượng (mức trung bình)

| # | Vấn đề | Bằng chứng | Hệ quả |
|---|---|---|---|
| 4.1 | Parse JSON kết quả dịch không an toàn — `JSON.parse(cleaned)` không bọc retry mềm | `Workspace.tsx:2445` | GPT trả sai định dạng → **hỏng cả lô 25 câu**, không tự phục hồi |
| 4.2 | Model AI cũ/cố định cứng: `whisper-1`, `gpt-4o-mini`, `tts-1` | `main/index.ts:851, 888, 197` | Chất lượng nhận diện/dịch/giọng thấp hơn model đời mới; không cho người dùng chọn |
| 4.3 | Không có timeout / nút hủy cho tác vụ FFmpeg dài | các handler `burn-subtitles`, `reverse-video`... | Lỡ tay là phải chờ hết, không dừng được |
| 4.4 | Prompt ASR hard-code theo ngôn ngữ, có câu tiếng Trung lạ | `Workspace.tsx:2362` | Prompt "mồi" có thể lái nội dung nhận diện sai lệch |
| 4.5 | Nhận diện nhà cung cấp TTS bằng heuristic độ dài chuỗi (`length === 20`) | `Workspace.tsx:2489` | Dễ đoán nhầm loại giọng, khó bảo trì |
| 4.6 | Toàn bộ CSS viết inline `style={{...}}` thủ công | khắp `App.tsx`, `Workspace.tsx` | Khó nhất quán, khó chỉnh theme, phình code |
| 4.7 | ID dự án dùng `Math.random().toString(36)` | `Dashboard.tsx:66` | Có xác suất trùng ID → ghi đè dự án |
| 4.8 | Không có xử lý khi Whisper > giới hạn 25MB dù có tính bitrate | `main/index.ts:126-136` | Video rất dài vẫn có thể vượt giới hạn API |

---

### 4.9. Vấn đề bổ sung (phát hiện sau khi quét toàn bộ, đã kiểm chứng)

| # | Vấn đề | Bằng chứng | Hệ quả |
|---|---|---|---|
| 4.9a | **Không có chức năng import file .srt/.ass từ ngoài** — chỉ có ASR + trích xuất nhúng | chỉ `openFile` cho video `main/index.ts:109` | Người dùng đã có sẵn file phụ đề không nạp vào chỉnh được — lỗ hổng tính năng lớn với công cụ phụ đề |
| 4.9b | **Bộ chọn giọng bị nhân đôi toàn bộ UI** | `Workspace.tsx:3290` và `:4988` | Sửa/thêm giọng ở một chỗ quên chỗ kia |
| 4.9c | **Danh sách giọng lệch giữa UI và main**; provider nhận diện bằng nhiều heuristic khác nhau | UI vs `main:522-526`; `extractVoiceId` `:256` + heuristic `length===20` `:2489` | Chọn nhầm giọng, khó bảo trì, dễ sai |
| 4.9d | **Thao tác DOM trực tiếp trộn với React** (`getElementById`, `.innerText`, set `.style.left` tay) | `Workspace.tsx:1913, 1955, 1909` | Chống lại mô hình React, dễ vỡ khi refactor |
| 4.9e | **Tra Hán-Việt gọi GPT từng câu riêng lẻ** | `Workspace.tsx:838` | Chậm & tốn tiền khi nhiều câu; nên gộp lô |
| 4.9f | Xử lý phím mũi tên Trái/Phải copy-paste ~40 dòng gần y hệt | `Workspace.tsx:1895-1986` | Trùng lặp, khó sửa đồng bộ |
| 4.9g | Ước lượng tốc độ đọc dựa trên đếm từ tách theo khoảng trắng (`wordCount * 0.4`) | `main/index.ts:88-91` | Công thức thiên về tiếng Anh; tiếng Việt tách từ theo space không chuẩn nghĩa → auto-speed lệch |

## 5. Điểm mạnh cần giữ

- Luồng nghiệp vụ hoàn chỉnh, đã chạy thật end-to-end.
- Theo dõi tiến độ FFmpeg qua IPC làm tốt — `main/index.ts:157-170`.
- Cache TTS bằng MD5 hash — thiết kế đúng — `main/index.ts:953`.
- Media protocol streaming hỗ trợ HTTP Range chuẩn — `main/index.ts:1090-1143`.
- Tính năng "healer" sửa lỗi font mojibake — thực dụng, hợp với phụ đề tiếng Việt/Trung — `Workspace.tsx:583`.
- Có undo/redo cho phụ đề — `Workspace.tsx:2108`.

---

## 6. Lộ trình đề xuất (ưu tiên theo rủi ro giảm dần)

> Nguyên tắc: **không viết lại từ đầu**. Dự án đã chạy được; refactor dần an toàn và nhanh ra sản phẩm hơn.

### Giai đoạn 0 — Chặn rủi ro phát hành (ưu tiên cao nhất, ~1 ngày)
- [ ] Revoke 2 API key đã lộ; xóa khỏi `DEFAULT_SETTINGS`.
- [ ] Chuyển lưu key sang `safeStorage` (mã hóa).
- [ ] Bundle FFmpeg (`ffmpeg-static`) và trỏ `spawn` tới binary bundle.
- [ ] Sửa metadata `package.json` (author, homepage, license).

### Giai đoạn 1 — Ổn định lõi (vài ngày)
- [ ] Gom 4 khối logic TTS trùng lặp thành 1 hàm `synthesizeSpeech` — `main/index.ts`.
- [ ] Parse JSON dịch an toàn + retry từng lô khi lỗi — `Workspace.tsx:2445`.
- [ ] Chuyển lưu trữ dự án từ localStorage sang file JSON trong `userData`.
- [ ] Thêm nút Hủy cho tác vụ FFmpeg đang chạy.

### Giai đoạn 2 — Kiến trúc & chất lượng
- [ ] Tách `Workspace.tsx` thành các hook và component:
  - `useSubtitles` (state phụ đề + undo/redo)
  - `useTimeline` (kéo/thả/zoom clip)
  - `useTtsExport` (sinh & xuất giọng)
  - Component con: `Timeline`, `SegmentList`, `VoicePanel`, `ExportPanel`
- [ ] Cho phép người dùng chọn model AI; cập nhật lên model đời mới.
- [ ] Chuyển CSS inline sang CSS module/biến theme.

### Giai đoạn 3 — Hoàn thiện phát hành
- [ ] Kiểm thử trên máy sạch (không cài sẵn FFmpeg).
- [ ] Ký ứng dụng (code signing) cho Windows/macOS nếu cần.
- [ ] Khởi tạo git repo + README hướng dẫn thật.

---

## 7. Ghi chú
Báo cáo này bám sát trạng thái mã nguồn tại thời điểm đánh giá. Các số dòng có thể lệch sau khi bắt đầu chỉnh sửa. Đề xuất làm theo thứ tự Giai đoạn 0 → 3; mỗi thay đổi sẽ được trao đổi và duyệt trước khi thực hiện.
