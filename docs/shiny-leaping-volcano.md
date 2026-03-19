# Context

Thiết kế UI này xuất phát từ bộ tài liệu `docs/` của hệ thống quản lý thư viện trường đại học. Mục tiêu là tạo một bộ màn hình nhất quán trong Stitch MCP, bám đúng nghiệp vụ, role-based access control, enum trạng thái và các luồng mượn/trả/in thẻ đã được đặc tả.

Nguồn chính:
- [docs/SRS.md](../..//d:/Vibe%20Coding/NguyenTienDung/frontend/docs/SRS.md)
- [docs/API_REFERENCE.md](../..//d:/Vibe%20Coding/NguyenTienDung/frontend/docs/API_REFERENCE.md)
- [docs/DATABASE_SCHEMA.md](../..//d:/Vibe%20Coding/NguyenTienDung/frontend/docs/DATABASE_SCHEMA.md)

## Mục tiêu

- Phân tích docs để chốt phạm vi UI theo 12 màn hình đã nêu trong SRS.
- Thiết kế trước các màn hình xương sống và workflow cốt lõi trong Stitch MCP.
- Đảm bảo layout phù hợp cho CRUD-heavy app, dễ dùng tại quầy, và tuân thủ các ràng buộc accessibility/layout từ web interface guidelines.

## Phạm vi thiết kế ưu tiên

### Phase 1: Shell + core screens
1. Login
2. App shell / Dashboard
3. Readers
4. Titles

### Phase 2: Transaction flows
5. Copies
6. Borrow loan
7. Return book
8. Search books

### Phase 3: Support/admin screens
9. Reports
10. Majors
11. Staff
12. Accounts / Roles

## Hướng thiết kế cần bám

### Shared layout/system
- App shell sau đăng nhập với sidebar theo nhóm: Operations, Catalog, Admin.
- Top bar có global search, role badge, user menu, logout.
- Page header thống nhất: title, subtitle, primary action.
- CRUD screens dùng pattern chung: filters -> table -> drawer/modal form -> confirm dialog.
- Dùng badge/status chip cho ReaderStatus, BookCopyStatus, LoanStatus, AccountRole.

### Fields/content theo docs
- Login: username, password.
- Readers: mã độc giả, họ tên, lớp, ngày sinh, giới tính, trạng thái, in thẻ.
- Majors: mã chuyên ngành, tên, mô tả.
- Titles: mã đầu sách, tên đầu sách, NXB, số trang, kích thước, tác giả, chuyên ngành.
- Copies: mã sách, đầu sách, tình trạng, ngày nhập.
- Borrow: mã độc giả, mã sách, ngày mượn, ghi chú tình trạng; kiểm tra độc giả chưa trả sách và chỉ cho mượn bản sao `AVAILABLE`.
- Return: mã phiếu mượn, ngày trả, tình trạng sau trả, ghi chú tình trạng.
- Reports: đầu sách mượn nhiều nhất, độc giả chưa trả.
- Staff: mã nhân viên, họ tên, thông tin liên hệ, trạng thái.
- Accounts: username, nhân viên liên kết, role, trạng thái.

### Accessibility/layout constraints
- Mọi control có semantic đúng, label đầy đủ, keyboard support hoàn chỉnh.
- Focus states rõ ràng, không phụ thuộc màu để biểu đạt trạng thái.
- Bảng và form phải chịu được text dài, empty state, loading state, error state.
- Có live region/toast cho async feedback.
- Modal/drawer phải xử lý Escape, overflow, và confirmation rõ ràng cho thao tác destructive.

## Kế hoạch triển khai Stitch MCP

### Bước 1: Tạo project Stitch
- Tạo project mới cho hệ thống quản lý thư viện.
- Chốt tên project và một bộ mô tả ngắn theo ngôn ngữ sản phẩm.

### Bước 2: Sinh shell và màn hình nền tảng
- Generate Login trước.
- Generate Dashboard và app shell để chốt navigation, spacing, table density, primary CTA.

### Bước 3: Sinh các màn CRUD cốt lõi
- Readers, Titles, Copies.
- Ưu tiên các component dùng lại được: table, form drawer, badge, empty state, confirmation dialog.

### Bước 4: Sinh luồng nghiệp vụ
- Borrow loan và Return book.
- Thiết kế các state nhấn mạnh rule: 1 reader chỉ có 1 phiếu mượn chưa trả, copy phải AVAILABLE, state cập nhật đồng bộ.

### Bước 5: Sinh các màn phụ trợ
- Search books, Reports, Majors, Staff, Accounts/Roles.
- Dùng lại system pattern đã chốt ở trên để giảm sai lệch UI.

### Bước 6: Iteration trong Stitch
- Tạo variant cho các màn có dữ liệu dày (table-heavy screens).
- Chỉnh theo enum/status trong API reference.
- Rà lại RBAC để ẩn/hiện action theo `ADMIN`, `LIBRARIAN`, `LEADER`.

## File/nguồn cần bám khi triển khai
- [docs/SRS.md](../..//d:/Vibe%20Coding/NguyenTienDung/frontend/docs/SRS.md)
- [docs/API_REFERENCE.md](../..//d:/Vibe%20Coding/NguyenTienDung/frontend/docs/API_REFERENCE.md)
- [docs/DATABASE_SCHEMA.md](../..//d:/Vibe%20Coding/NguyenTienDung/frontend/docs/DATABASE_SCHEMA.md)

## Điểm còn thiếu cần xác nhận trước khi chốt UI final
- Brand system: logo, màu chủ đạo, font.
- Mức chi tiết của các form field và validation.
- Print-card layout mong muốn.
- Report KPI/charts bắt buộc.
- Scope responsive: desktop-only hay cần tablet/mobile thực dụng.
- Ngôn ngữ UI: chỉ tiếng Việt hay song ngữ.

## Verification

Sau khi thiết kế trên Stitch, kiểm tra lại:
- Các màn hình khớp 12 UI screens trong SRS.
- Enum/status hiển thị đúng theo API reference.
- Luồng borrow/return thể hiện rõ các business rules.
- Layout không vỡ với text dài, empty states, và loading/error states.
- Keyboard/focus/accessibility basics có trong mọi screen.
