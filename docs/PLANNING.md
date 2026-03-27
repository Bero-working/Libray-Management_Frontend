# PLANNING

## 1. Context

Người dùng muốn có một kế hoạch triển khai dựa trên các prototype giao diện `UI/admin-layout.html`, `UI/librarian-layout.html` và các tài liệu `docs/SRS.md`, `docs/API_REFERENCE.md`, `docs/DATABASE_SCHEMA.md`. Mục tiêu là chia roadmap thành từng phase theo actor để chuyển từ wireframe tĩnh sang ứng dụng vận hành thật, đồng bộ giữa UI, API và ràng buộc dữ liệu.

Từ tài liệu hiện tại:
- Actor chính gồm: `LIBRARIAN`, `ADMIN`, `LEADER`, và `Reader` (gián tiếp).
- Prototype UI đã có khung chính cho librarian/admin nhưng còn tĩnh và chưa phủ hết các màn hình trong SRS.
- API runtime đã được mô tả là có đủ các nhóm endpoint cốt lõi: auth, readers, majors, titles, copies, loans, reports, staff, accounts, search.
- Business rules quan trọng đã rõ: mỗi độc giả chỉ có tối đa 1 phiếu mượn chưa trả, chỉ copy `AVAILABLE` mới được mượn, trả sách phải đồng bộ trạng thái loan/copy, và nhiều thao tác xóa bị chặn bởi dữ liệu phụ thuộc.
- `FR-25` (audit trail) chưa được bao phủ đầy đủ nên nên được tách thành future phase.

---

## 2. Scope và assumptions

### 2.1 Scope
- Xây dựng web app nội bộ theo role cho `LIBRARIAN`, `ADMIN`, `LEADER`.
- Tích hợp UI với API đã được đặc tả trong `docs/API_REFERENCE.md`.
- Hoàn thiện các màn hình CRUD, tra cứu, mượn/trả, báo cáo theo đúng SRS.
- Thiết kế frontend đủ chặt để phản ánh đúng các business rule từ schema/docs.

### 2.2 Assumptions
- API contract trong `docs/API_REFERENCE.md` là nguồn chuẩn để tích hợp.
- `Reader` không có portal riêng ở giai đoạn hiện tại; chỉ xuất hiện như dữ liệu/luồng nghiệp vụ do librarian/admin thao tác.
- Các prototype HTML hiện tại được dùng làm nguồn UI/UX baseline, không phải kiến trúc React/Next cuối cùng.
- `FR-25` sẽ được giữ như phase sau, nhưng các module hiện tại nên được thiết kế theo hướng dễ gắn audit sau này.

---

## 3. Shared foundation

### Phase 0 — Shared foundation

**Mục tiêu**
- Dựng nền tảng dùng chung cho toàn app trước khi chia theo actor.
- Chuẩn hóa auth, app shell, route guard, data fetching, error handling, validation mapping.

**Phạm vi**
- Login chung và điều hướng theo role.
- Layout shell dùng lại tinh thần từ `UI/admin-layout.html` và `UI/librarian-layout.html`.
- RBAC ở cấp route/menu/component.
- API client thống nhất, loading/error/empty states, mapping lỗi backend sang thông báo UI.

**Màn hình/chức năng**
- Login
- App shell
- Sidebar/topbar theo role
- Route protection và redirect sau login

**API / entity liên quan**
- Auth APIs: `/auth/login`, `/auth/refresh`, `/auth/logout`
- Role mapping từ account/user payload

**Phụ thuộc**
- `docs/API_REFERENCE.md`
- `UI/admin-layout.html`
- `UI/librarian-layout.html`

**Acceptance checkpoints**
- Đăng nhập thành công và redirect đúng role.
- Người dùng không đúng role không truy cập được route bị chặn.
- App shell hiển thị menu đúng theo actor.
- Các trạng thái loading/error thống nhất toàn hệ thống.

---

## 4. Roadmap theo actor

### Phase 1 — Librarian core operations

**Mục tiêu**
- Hoàn thiện actor vận hành chính của hệ thống.
- Ưu tiên các luồng có giá trị nghiệp vụ cao nhất: tra cứu, đầu sách, bản sao, mượn/trả, báo cáo vận hành.

**Màn hình**
- Librarian Dashboard
- Quản lý đầu sách
- Quản lý bản sao sách
- Tra cứu sách
- Xử lý mượn / trả
- Báo cáo vận hành / overdue / top borrowed

**API / entity liên quan**
- `GET/POST/PATCH/DELETE /titles`
- `GET/POST/PATCH/DELETE /copies`
- `GET /search/books`
- `GET /loans`, `GET /loans/{id}`, `POST /loans`, `PATCH /loans/{id}/return`
- `GET /reports/top-borrowed-titles`
- `GET /reports/unreturned-readers`
- Entities: `DAU_SACH`, `BAN_SAO_SACH`, `PHIEU_MUON`, `DOC_GIA`

**Business rules cần phản ánh ở UI**
- Mỗi độc giả chỉ được có tối đa 1 phiếu mượn chưa trả.
- Chỉ copy `AVAILABLE` mới được cho mượn.
- Trả sách phải cập nhật đồng bộ `Loan.status` và `BookCopyStatus`.
- Các thao tác xóa phải phản ánh lỗi phụ thuộc từ backend rõ ràng.

**Phụ thuộc**
- Phase 0 hoàn tất.
- Data layer và validation mapping ổn định.

**Acceptance checkpoints**
- Tạo/sửa/xem title hoạt động đúng.
- Tạo/sửa/xem copy hoạt động đúng.
- Luồng mượn sách chặn đúng khi reader đang có open loan.
- Luồng trả sách cập nhật đúng trạng thái copy/loan.
- Báo cáo top borrowed và unreturned readers hiển thị đúng dữ liệu API.

### Phase 2 — Admin management

**Mục tiêu**
- Hoàn thiện actor quản trị hệ thống.
- Đóng các gap còn thiếu giữa prototype và SRS/API: majors management, full account CRUD, staff management rõ ràng.

**Màn hình**
- Admin Dashboard
- Quản lý độc giả
- Quản lý nhân viên
- Quản lý tài khoản & phân quyền
- Quản lý chuyên ngành

**API / entity liên quan**
- `GET/POST/PATCH/DELETE /readers`
- `POST /readers/{ma_doc_gia}/print-card`
- `GET/POST/PATCH/DELETE /staff`
- `GET/POST/PATCH/DELETE /accounts`
- `GET/POST/PATCH/DELETE /majors`
- Entities: `DOC_GIA`, `NHAN_VIEN`, `TAI_KHOAN`, `CHUYEN_NGANH`

**Business rules cần phản ánh ở UI**
- Không xóa reader nếu còn sách chưa trả.
- Không xóa major nếu còn title tham chiếu.
- Account phải gắn đúng staff và role hợp lệ.
- Validation mã định danh unique phải được thể hiện rõ ở form.

**Phụ thuộc**
- Phase 0.
- Có thể tái sử dụng table/form pattern từ Phase 1.

**Acceptance checkpoints**
- CRUD readers/staff/accounts/majors hoạt động đầy đủ.
- In thẻ thư viện gọi đúng API và xử lý đúng kiểu response PDF.
- Role assignment được enforce đúng ở UI.
- Xử lý lỗi backend/business rule rõ ràng, không mơ hồ.

### Phase 3 — Leader reporting

**Mục tiêu**
- Tạo trải nghiệm riêng cho actor `LEADER` thay vì chỉ dùng chung màn báo cáo của librarian.
- Tập trung vào dashboard và reporting read-only.

**Màn hình**
- Leader Dashboard
- Báo cáo top borrowed titles
- Báo cáo độc giả chưa trả
- Bộ lọc theo thời gian / drill-down nếu API hỗ trợ

**API / entity liên quan**
- `GET /reports/top-borrowed-titles`
- `GET /reports/unreturned-readers`
- Có thể dùng thêm `GET /search/books` cho luồng drill-down nhẹ
- Entities: tổng hợp từ `PHIEU_MUON`, `BAN_SAO_SACH`, `DAU_SACH`, `DOC_GIA`

**Phụ thuộc**
- Phase 0.
- Báo cáo runtime đã ổn định từ Phase 1.

**Acceptance checkpoints**
- Leader chỉ thấy các route/report được phân quyền.
- Bộ lọc thời gian hoạt động đúng theo contract API.
- Màn hình báo cáo phù hợp tác vụ read-only, không lẫn chức năng quản trị.

### Phase 4 — Reader-facing indirect flows

**Mục tiêu**
- Không tạo portal riêng cho reader, nhưng hoàn thiện các điểm chạm liên quan tới reader trong module admin/librarian.
- Chuẩn hóa chi tiết độc giả, lịch sử mượn, trạng thái hiện tại.

**Màn hình/chức năng**
- Reader detail
- Loan history trong hồ sơ reader
- Trạng thái thẻ/thông tin cơ bản phục vụ tra cứu nhanh tại quầy

**API / entity liên quan**
- `GET /readers`
- `GET /readers/{ma_doc_gia}`
- `GET /loans`
- `GET /loans/{id}`
- Entities: `DOC_GIA`, `PHIEU_MUON`

**Phụ thuộc**
- Phase 1 và Phase 2.

**Acceptance checkpoints**
- Tra cứu reader nhanh từ mã/tên.
- Hồ sơ reader hiển thị được trạng thái hiện tại và lịch sử mượn liên quan.
- Dữ liệu reader nhất quán giữa admin và librarian modules.

---

## 5. Future phase

### Phase 5 — Audit trail / hardening

**Mục tiêu**
- Bổ sung phần còn thiếu của `FR-25` khi backend sẵn sàng.
- Tăng mức sẵn sàng production: audit hooks, tracing, test coverage mở rộng, UX hardening.

**Phạm vi**
- Nhật ký thao tác create/update/delete.
- Hiển thị lịch sử thay đổi nếu có endpoint phù hợp.
- Chuẩn hóa event metadata theo actor/action/module.

**Acceptance checkpoints**
- Có thể truy vết ai thao tác gì trên bản ghi chính.
- Audit không làm hỏng các luồng cũ.

---

## 6. Risks và gaps từ tài liệu hiện tại

- Prototype hiện thiếu các màn hình `majors` và account CRUD đầy đủ dù API đã có.
- Chưa có UI riêng cho `LEADER` dù role này đã có trong docs và RBAC.
- `readers` và `copies` runtime docs ghi nhận chưa hoàn chỉnh pagination/filtering, nên cần lên kế hoạch UI linh hoạt cho state hiện tại và dễ mở rộng sau.
- `FR-25` chưa fully covered nên không nên giả định có sẵn audit UI/API ở giai đoạn đầu.
- Wireframe tĩnh chưa mô tả đủ loading/error/empty/permission states.

---

## 7. Recommended delivery order

1. **Phase 0** — Shared foundation
2. **Phase 1** — Librarian core operations
3. **Phase 2** — Admin management
4. **Phase 3** — Leader reporting
5. **Phase 4** — Reader-facing indirect flows
6. **Phase 5** — Audit trail / hardening

**Lý do ưu tiên**
- Librarian là actor vận hành chính và tạo giá trị nghiệp vụ cao nhất.
- Admin đứng sau để hoàn thiện quản trị dữ liệu và RBAC.
- Leader reporting chỉ nên làm sau khi dữ liệu vận hành đã ổn định.
- Audit trail là phase tăng cường sau cùng vì hiện docs cũng xác nhận chưa full coverage.

---

## 8. Critical files

- `docs/SRS.md`
- `docs/API_REFERENCE.md`
- `docs/DATABASE_SCHEMA.md`
- `UI/admin-layout.html`
- `UI/librarian-layout.html`
- `docs/PLANNING.md`

---

## 9. Reuse notes

Các artifact nên được dùng làm nguồn chuẩn khi thực thi:
- UI baseline và navigation pattern từ `UI/admin-layout.html`.
- UI baseline và flow grouping cho librarian từ `UI/librarian-layout.html`.
- API contract, role, enum, error semantics từ `docs/API_REFERENCE.md`.
- Entity relationship và business rules từ `docs/DATABASE_SCHEMA.md`.
- Actor/use-case/FR-BR traceability từ `docs/SRS.md`.

---

## 10. Verification strategy

### 10.1 Tài liệu
- Đối chiếu từng phase với actor/use case trong `docs/SRS.md`.
- Đối chiếu từng màn hình planned với endpoint tương ứng trong `docs/API_REFERENCE.md`.
- Đối chiếu từng business rule UI với constraint trong `docs/DATABASE_SCHEMA.md`.

### 10.2 Kiểm thử theo actor
- **Librarian:** title/copy/search/loan/return/report flows.
- **Admin:** readers/staff/accounts/majors CRUD và role assignment.
- **Leader:** report-only access và time filter behavior.

### 10.3 Kiểm thử phân quyền
- Tài khoản sai role không vào được route, menu, và action bị chặn.
- Các action chỉ hiển thị khi actor có quyền.

### 10.4 Kiểm thử ràng buộc nghiệp vụ
- Không cho mượn nếu reader đang có loan mở.
- Không cho mượn copy không ở trạng thái `AVAILABLE`.
- Trả sách cập nhật đúng trạng thái `RETURNED` hoặc `NEEDS_REVIEW`.
- Các case xóa vi phạm phụ thuộc trả lỗi đúng và UI hiển thị rõ.

### 10.5 Kiểm thử tích hợp
- Chạy ứng dụng, đăng nhập theo từng role và đi qua critical flows end-to-end.
- Gọi API thật từ UI thay vì chỉ render dữ liệu mock.
- Kiểm tra loading/error/empty states trên các màn hình danh sách và chi tiết.
