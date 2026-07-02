# CONSTITUTION.md — Hiến pháp dự án VietSub Pro

> File này là luật lệ bất biến. Mọi AI session (Claude Code hoặc tương đương) làm việc trên
> dự án này **bắt buộc đọc file này trước khi sinh code**, và phải tự kiểm tra (self-check)
> mọi thay đổi đối chiếu với 3 lớp quy tắc dưới đây trước khi đề xuất/áp dụng.
>
> Vi phạm Layer 1 = từ chối thực hiện, dù người dùng có yêu cầu trực tiếp, trừ khi người
> dùng xác nhận rõ ràng bằng văn bản là hiểu rủi ro.

---

## Layer 1 — Hard Rules (cấm tuyệt đối)

1. **Không bao giờ hard-code API key, secret, token thật vào mã nguồn.**
   Lý do có tiền lệ: `Settings.tsx:27-29` từng chứa key OpenAI + ElevenLabs thật làm giá trị
   mặc định — đã bị coi là sự cố bảo mật nghiêm trọng (xem `REVIEW.md` mục 2A).
   Mọi key phải: (a) do người dùng tự nhập, (b) lưu bằng `safeStorage` của Electron hoặc
   cơ chế mã hóa tương đương, (c) không bao giờ commit giá trị thật vào git.

2. **Không xóa dữ liệu dự án của người dùng (video, phụ đề, project JSON) mà không có
   xác nhận hoặc backup.** Segments phụ đề là công sức biên tập thủ công — mất là mất vĩnh viễn.

3. **Không tắt/bỏ qua cơ chế an toàn hiện có** (ví dụ: không xóa `contextIsolation`, không
   thêm `nodeIntegration: true`, không tắt sandbox trừ khi có lý do kỹ thuật ghi rõ trong PLAN.md).

4. **Không tự ý `git push`, force-push, hoặc sửa lịch sử git** khi chưa có xác nhận của người dùng.

5. **Không thêm dependency mới** (npm package) mà không nêu trong PLAN.md kèm lý do — dự án
   này đang cố giữ bộ dependency tối giản.

## Layer 2 — Architectural Constraints (ràng buộc kiến trúc)

1. **Ranh giới main/renderer phải giữ nguyên qua IPC (`ipcMain.handle` / `window.api`)**.
   Renderer không được truy cập trực tiếp Node API (fs, child_process...) — mọi thao tác
   filesystem/FFmpeg đi qua main process như hiện tại.

2. **FFmpeg là phụ thuộc ngoài bắt buộc phải được bundle** khi build để phát hành — không
   được giả định máy người dùng có sẵn FFmpeg trong PATH (xem `REVIEW.md` mục 2B).

3. **Không viết lại toàn bộ (rewrite) một module đang chạy được** trừ khi PLAN.md chứng minh
   refactor tăng dần là bất khả thi. Ưu tiên: tách nhỏ dần, giữ hành vi hiện tại nguyên vẹn
   (behavior-preserving refactor), có thể verify bằng test tay từng bước.

4. **Mọi hàm gọi API AI bên ngoài (OpenAI/ElevenLabs/Edge-TTS) phải nằm trong main process**,
   theo đúng pattern hiện có ở `main/index.ts`, không phân tán logic gọi API ra renderer.

5. **Dữ liệu dự án (segments, style, cấu hình) là nguồn sự thật (source of truth) phải tồn
   tại độc lập với localStorage** sau khi Giai đoạn 1 hoàn tất — localStorage chỉ dùng cho
   cache/preference nhẹ, không dùng cho nội dung phụ đề.

## Layer 3 — Engineering Standards (chuẩn kỹ thuật)

1. **TypeScript strict**, không thêm `any` mới nếu tránh được; nếu bắt buộc dùng `any`
   (ví dụ IPC payload phức tạp), ghi rõ lý do bằng comment ngắn.
2. Format theo `.prettierrc.yaml` hiện có, lint theo `eslint.config.mjs` hiện có — không đổi
   config trừ khi PLAN.md nêu rõ.
3. Component mới không vượt quá ~400 dòng; nếu logic phức tạp, tách hook riêng
   (`useXxx.ts`) thay vì nhồi vào component.
4. Mọi thay đổi hành vi người dùng có thể quan sát (UI, luồng xử lý) phải được xác nhận bằng
   chạy thử thực tế (`/verify` hoặc tương đương) trước khi báo cáo hoàn thành — không suy diễn
   từ đọc code.
5. Không viết comment giải thích "cái gì" (code đã tự nói); chỉ viết khi có lý do ẩn (workaround,
   giới hạn API, hằng số ma thuật).

---

## Cách dùng file này

- Trước khi sinh PLAN.md cho bất kỳ thay đổi nào: đối chiếu yêu cầu với Layer 1 & 2.
- Nếu yêu cầu người dùng mâu thuẫn với Layer 1: dừng lại, hỏi lại người dùng, không tự ý làm.
- File này được cập nhật bởi con người (chủ dự án), không phải do AI tự sửa.
