# CONTEXT.md — Giai đoạn 0: Bảo mật key & Bundle FFmpeg

## Nỗi đau thực tế (Problem)

Dự án hiện **không thể phát hành an toàn cho người dùng khác cài đặt** vì hai lý do cụ thể:

1. **Rò rỉ tiền thật:** `Settings.tsx:27-29` chứa API key OpenAI và ElevenLabs thật làm giá
   trị mặc định. Bất kỳ ai cài app (hoặc mở file cài đặt/source) đều lấy được key và có thể
   tiêu tiền trên tài khoản của chủ dự án. Đây không phải rủi ro lý thuyết — key đã tồn tại
   trong git-trackable source.
2. **App vỡ trên máy người dùng cuối:** toàn bộ tính năng cốt lõi (tách audio, ghép phụ đề,
   xuất video, lồng tiếng) đều gọi `spawn('ffmpeg', ...)` giả định FFmpeg có sẵn trong PATH
   hệ thống. Máy chủ dự án chạy được vì đã cài FFmpeg thủ công từ trước — nhưng người dùng
   thông thường tải app về sẽ **không cài FFmpeg** và mọi thao tác chính sẽ báo lỗi ngay.

## Người dùng bị ảnh hưởng (Actors)

- **Chủ dự án (Product Owner):** rủi ro tài chính trực tiếp nếu key bị lộ và bị lạm dụng.
- **Người dùng cuối (End user) cài app:** trải nghiệm "cài xong không dùng được" — tính năng
  chính báo lỗi ngay lần thử đầu tiên nếu chưa có FFmpeg.

## Ràng buộc & giả định

- Ứng dụng chạy trên Windows là chính (môi trường phát triển hiện tại là Windows 11); cần cân
  nhắc macOS/Linux nhưng không bắt buộc xử lý ngay trong giai đoạn này nếu build target hiện
  tại chỉ là Windows.
- Không được phá vỡ luồng sử dụng hiện tại: người dùng vẫn nhập API key riêng của họ trong màn
  Settings như cũ, chỉ khác là không có giá trị mặc định thật và được mã hóa khi lưu.
- Giữ nguyên hành vi gọi FFmpeg (tham số, filter, cách xử lý progress) — chỉ đổi **đường dẫn
  tới binary FFmpeg được gọi**, không đổi logic dùng FFmpeg.
- Kích thước gói cài đặt sẽ tăng đáng kể (FFmpeg full build ~70-100MB) — đây là đánh đổi chấp
  nhận được để app chạy được ngay sau khi cài, đã được chủ dự án hiểu rõ khi chọn hướng "phát
  hành cho người dùng khác".

## Thuật ngữ

- **safeStorage**: API mã hóa dữ liệu theo máy của Electron (`electron.safeStorage`), dùng để
  lưu secret mà không cần người dùng tự quản lý key mã hóa.
- **Bundle FFmpeg**: đóng gói binary FFmpeg cùng ứng dụng khi build, để không phụ thuộc vào
  cài đặt hệ thống của người dùng.

## Ngoài phạm vi (Out of scope cho giai đoạn này)

- Không refactor `Workspace.tsx` (thuộc Giai đoạn 2).
- Không đổi model AI, không thêm tính năng mới.
- Không xử lý code signing (ký ứng dụng) — thuộc Giai đoạn 3.
- Không xử lý macOS/Linux FFmpeg binary nếu build target hiện tại chỉ Windows (sẽ xác nhận
  lại trong SPEC.md).
