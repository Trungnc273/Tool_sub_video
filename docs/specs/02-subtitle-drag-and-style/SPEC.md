# SPEC.md — Kéo-thả phụ đề trên video & gom style vào màn edit

## Bối cảnh
Người dùng muốn chỉnh vị trí phụ đề trực quan bằng cách kéo chữ trên video preview (hiện
chỉ có 2 thanh trượt posX/posY), và chỉnh màu chữ/viền ngay màn edit (hiện phải sang tab
Cài đặt). Duyệt miệng 2026-07-03.

## Yêu cầu (EARS)

- **FR1**: WHEN người dùng nhấn giữ chuột vào dòng phụ đề trên video preview và kéo, hệ
  thống SHALL di chuyển phụ đề theo con trỏ theo thời gian thực (60fps, cập nhật DOM trực
  tiếp, không re-render).
- **FR2**: WHEN người dùng thả chuột, hệ thống SHALL lưu posX/posY mới vào settings
  (một lần duy nhất) — đồng bộ với 2 thanh trượt hiện có và video xuất ra (ASS).
- **FR3**: Vị trí kéo SHALL bị giới hạn trong khung video (posX 5–95%, posY 5–80% — cùng
  giới hạn với thanh trượt hiện có).
- **FR4**: Bảng "Thiết lập phụ đề" trong màn edit SHALL có thêm: màu chữ, màu viền, độ dày
  viền — cùng giá trị với tab Cài đặt (một nguồn dữ liệu `settings.subtitleStyle`).
- **FR5**: Con trỏ chuột SHALL đổi thành dạng "grab/grabbing" khi hover/kéo phụ đề để gợi ý
  kéo được.

## Tiêu chí chấp nhận
- [ ] Kéo phụ đề đến vị trí bất kỳ → thả → thanh trượt posX/posY nhảy theo đúng giá trị.
- [ ] Xuất video → phụ đề nằm đúng chỗ đã kéo.
- [ ] Đổi màu chữ/viền trong màn edit → preview đổi ngay lập tức, tab Cài đặt hiển thị
      cùng giá trị.
- [ ] Kéo không gây giật/lag (không ghi settings trong lúc kéo).
- [ ] Typecheck + lint pass, không lỗi mới.
