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
- `Reader` không có portal riêng ở giai đoạn hiện tại; chỉ xuất hiện như dữ liệu/luồng nghiệp vụ do `LIBRARIAN` thao tác, không phải scope quản trị của `ADMIN`.
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
- Ưu tiên các luồng có giá trị nghiệp vụ cao nhất: độc giả/thẻ thư viện, chuyên ngành, đầu sách, bản sao, tra cứu, mượn/trả, báo cáo vận hành.

**Màn hình**
- Librarian Dashboard
- Quản lý độc giả / thẻ thư viện
- Quản lý chuyên ngành
- Quản lý đầu sách
- Quản lý bản sao sách
- Tra cứu sách
- Xử lý mượn / trả
- Báo cáo vận hành / overdue / top borrowed

**Page breakdown cho majors trong Phase 1**
- Danh sách chuyên ngành (`/librarian/majors`) để hiển thị danh mục, tìm nhanh và khởi tạo thao tác CRUD.
- Tạo chuyên ngành (`/librarian/majors/new`) với form nhập `ma_chuyen_nganh`, `ten_chuyen_nganh`, `mo_ta`.
- Chi tiết chuyên ngành (`/librarian/majors/{ma_chuyen_nganh}`) để xem dữ liệu hiện tại trước khi chỉnh sửa/xóa.
- Cập nhật chuyên ngành (`/librarian/majors/{ma_chuyen_nganh}/edit`) để sửa `ten_chuyen_nganh` và `mo_ta`.
- Xóa chuyên ngành được kích hoạt từ page danh sách hoặc chi tiết với confirm state và thông báo lỗi phụ thuộc rõ ràng.

**API / entity liên quan**
- `GET/POST/PATCH/DELETE /readers`
- `POST /readers/{ma_doc_gia}/print-card`
- `GET/POST/PATCH/DELETE /majors`
- `GET/POST/PATCH/DELETE /titles`
- `GET/POST/PATCH/DELETE /copies`
- `GET /search/books`
- `GET /loans`, `GET /loans/{id}`, `POST /loans`, `PATCH /loans/{id}/return`
- `GET /reports/top-borrowed-titles`
- `GET /reports/unreturned-readers`
- Entities: `DOC_GIA`, `CHUYEN_NGANH`, `DAU_SACH`, `BAN_SAO_SACH`, `PHIEU_MUON`

**Business rules cần phản ánh ở UI**
- Không xóa reader nếu còn sách chưa trả.
- Không xóa major nếu còn title tham chiếu.
- Mỗi độc giả chỉ được có tối đa 1 phiếu mượn chưa trả.
- Chỉ copy `AVAILABLE` mới được cho mượn.
- Trả sách phải cập nhật đồng bộ `Loan.status` và `BookCopyStatus`.
- Các thao tác xóa phải phản ánh lỗi phụ thuộc từ backend rõ ràng.

**Phụ thuộc**
- Phase 0 hoàn tất.
- Data layer và validation mapping ổn định.

**Acceptance checkpoints**
- CRUD readers hoạt động đúng và in thẻ thư viện xử lý đúng response `application/pdf`.
- Các page majors (list/create/detail/edit) hoạt động đúng, bám sát API `GET/POST/PATCH/DELETE /majors`.
- Delete major hiển thị rõ lỗi phụ thuộc khi backend trả `409 CONFLICT` do còn title tham chiếu.
- CRUD majors được tái sử dụng nhất quán ở titles/search.
- Tạo/sửa/xem title hoạt động đúng.
- Tạo/sửa/xem copy hoạt động đúng.
- Luồng mượn sách chặn đúng khi reader đang có open loan.
- Luồng trả sách cập nhật đúng trạng thái copy/loan.
- Báo cáo top borrowed và unreturned readers hiển thị đúng dữ liệu API.

### Phase 2 — Admin management

**Mục tiêu**
- Hoàn thiện actor quản trị hệ thống.
- Bám đúng boundary actor của SRS/RBAC: `ADMIN` chỉ quản lý nhân viên, tài khoản và phân quyền; không ôm lại các luồng `readers`/`majors` của `LIBRARIAN`.
- Hoàn thiện vòng đời quản trị truy cập: staff master data, account provisioning, role assignment, trạng thái hoạt động.

**Màn hình**
- Admin Dashboard
- Quản lý nhân viên
- Quản lý tài khoản
- Gán role / trạng thái tài khoản / reset mật khẩu
- Tổng quan phân bổ role và tình trạng truy cập

**API / entity liên quan**
- `GET/POST/PATCH/DELETE /staff`
- `GET/POST/PATCH/DELETE /accounts`
- Entities: `NHAN_VIEN`, `TAI_KHOAN`
- Role enum: `ADMIN`, `LIBRARIAN`, `LEADER`

**Business rules cần phản ánh ở UI**
- Mỗi nhân viên chỉ gắn tối đa 1 tài khoản (`TAI_KHOAN.ma_nhan_vien` unique).
- Account phải gắn đúng staff tồn tại và role hợp lệ; UI nên ưu tiên chọn staff chưa có account.
- Cập nhật account phải hỗ trợ đổi role, khóa/mở trạng thái và đổi mật khẩu qua `newPassword` khi cần.
- Luồng xóa/khóa cần phản ánh đúng semantics runtime hiện tại: `staff` và `accounts` đang soft delete, còn trường hợp có phụ thuộc nên ưu tiên ngừng hoạt động thay vì xóa cứng.
- Validation mã định danh/username unique phải được thể hiện rõ ở form.

**Phụ thuộc**
- Phase 0.
- Có thể tái sử dụng table/form pattern từ Phase 1.
- Không duplicate UI của `readers` và `majors`; hai module này tiếp tục thuộc roadmap librarian.

**Acceptance checkpoints**
- CRUD staff hoạt động đầy đủ theo đúng role `ADMIN`.
- CRUD accounts hoạt động đầy đủ, gồm tạo account, cập nhật role/status và đổi mật khẩu khi cần.
- Một staff không thể bị gắn nhiều hơn một account từ UI flow thông thường.
- Role assignment được phản ánh đúng ở route/menu access sau lần đăng nhập kế tiếp hoặc sau khi refresh session.
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
- Không tạo portal riêng cho reader, nhưng hoàn thiện các điểm chạm liên quan tới reader trong module librarian và các luồng tra cứu dùng chung.
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
- Phase 1.

**Acceptance checkpoints**
- Tra cứu reader nhanh từ mã/tên.
- Hồ sơ reader hiển thị được trạng thái hiện tại và lịch sử mượn liên quan.
- Dữ liệu reader nhất quán giữa module độc giả và module mượn/trả.

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

- Prototype hiện chưa phản ánh đúng boundary actor: `readers` và `majors` thuộc librarian, còn `staff` và `accounts` thuộc admin; account CRUD cũng chưa được mô tả đủ.
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
- Admin đứng sau để hoàn thiện quản trị truy cập, nhân sự nội bộ và RBAC.
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
- **Librarian:** reader/major/title/copy/search/loan/return/report flows.
- **Admin:** staff/accounts CRUD, staff-account linking, role assignment và account status flows.
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
