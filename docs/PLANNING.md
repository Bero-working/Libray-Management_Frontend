# Frontend Implementation Planning

## 1. Nguồn chuẩn để bám theo

Kế hoạch này được suy ra từ 3 tài liệu nguồn và phải luôn ưu tiên theo thứ tự sau:

1. `docs/SRS.md` – phạm vi nghiệp vụ, actor, FR, BR, MVP.
2. `docs/API_REFERENCE.md` – contract API, RBAC, envelope response, lỗi nghiệp vụ.
3. `docs/DATABASE_SCHEMA.md` – domain model, enum, quan hệ dữ liệu, các ràng buộc ảnh hưởng UI.

> Lưu ý: frontend hiện vẫn gần như là scaffold mặc định của Next.js, nên phải triển khai từ nền tảng dùng chung trước rồi mới đi vào từng module nghiệp vụ.

---

## 2. Mục tiêu MVP frontend

Xây dựng giao diện quản lý thư viện cho 3 vai trò nội bộ:

- `ADMIN`: quản lý nhân viên, tài khoản, phân quyền.
- `LIBRARIAN`: quản lý độc giả, chuyên ngành, đầu sách, bản sao, mượn–trả, báo cáo.
- `LEADER`: chỉ xem báo cáo.

Frontend phải bao phủ được các màn hình MVP đã nêu trong `docs/SRS.md`, đồng thời phản ánh đúng các business rule trọng yếu trong luồng UI chứ không chỉ đẩy lỗi về backend.

---

## 3. Định hướng kiến trúc frontend

### 3.1 Kiến trúc thư mục đề xuất

- `app/`: route, layout, loading, error, route guard ở mức App Router.
- `features/`: module nghiệp vụ theo domain.
- `shared/`: UI dùng chung, table, dialog, pagination, badge, form field.
- `lib/`: API client, auth/session, permission helpers, enum mappers, query param helpers.

### 3.2 Tổ chức route đề xuất

```text
app/
  (public)/login/page.tsx
  (protected)/layout.tsx
  (protected)/page.tsx
  (protected)/(librarian)/readers/page.tsx
  (protected)/(librarian)/majors/page.tsx
  (protected)/(librarian)/titles/page.tsx
  (protected)/(librarian)/copies/page.tsx
  (protected)/(librarian)/search/books/page.tsx
  (protected)/(librarian)/loans/page.tsx
  (protected)/(librarian)/loans/new/page.tsx
  (protected)/(librarian)/loans/[id]/page.tsx
  (protected)/(reports)/reports/top-borrowed-titles/page.tsx
  (protected)/(reports)/reports/unreturned-readers/page.tsx
  (protected)/(admin)/staff/page.tsx
  (protected)/(admin)/accounts/page.tsx
```

### 3.3 Nguyên tắc kỹ thuật

- Ưu tiên App Router và server-first rendering.
- Chỉ dùng `"use client"` cho component tương tác thực sự.
- Chuẩn hóa API client để xử lý thống nhất token, success envelope, error envelope.
- Tập trung tách domain theo `auth`, `readers`, `majors`, `titles`, `copies`, `search`, `loans`, `reports`, `staff`, `accounts`.
- Tạo một lớp mapping enum/label dùng chung ngay từ đầu để tránh lệch dữ liệu UI.
- Form và dữ liệu nhập phải đi qua schema validation tập trung, ưu tiên Zod.
- API state phải đi qua query/mutation pattern thống nhất, ưu tiên TanStack Query.
- Shared UI primitives phải được xây trên shadcn/ui kết hợp Tailwind CSS để tránh phân mảnh giao diện.
- Tránh phát sinh nhiều pattern styling, fetch state và form handling song song giữa các module.

### 3.4 Frontend stack chuẩn hóa

Frontend stack được chuẩn hóa theo các quyết định sau:

- **Tailwind CSS** là chuẩn styling chính cho layout, spacing, responsive behavior và theme token cơ bản.
- **shadcn/ui** là nền cho shared UI primitives và component composition; các module mới phải ưu tiên tái sử dụng từ hệ này thay vì tự tạo thêm nhiều bộ UI song song.
- **TanStack Query** là chuẩn cho API fetching, caching, mutation state, loading/error state và invalidation cho server state.
- **Zod** là chuẩn cho runtime validation của form, filter input và các input boundary phía frontend.

Hiện trạng repo cần được phản ánh đúng khi triển khai theo tài liệu này:

- Tailwind CSS đã hiện diện trong repo (`package.json`, `app/globals.css`).
- TanStack Query, shadcn/ui và Zod hiện chưa được cài đặt/cấu hình trong project và phải được đưa vào như foundation work ở Phase 0.

---

## 4. Các business rule bắt buộc phải phản ánh trên UI

Những rule sau phải được thể hiện rõ trong UI/UX, không chỉ xử lý ở backend:

- `BR-01`: chưa đăng nhập thì không được vào protected routes.
- `FR-02`: menu, route, action button phải ẩn/disable theo role.
- `BR-04`: một độc giả chỉ được có tối đa 01 phiếu mượn chưa trả.
- `BR-06`: chỉ bản sao có trạng thái `AVAILABLE` mới được phép cho mượn.
- `BR-08`: không cho xóa bản sao đang mượn hoặc còn gắn giao dịch chưa hoàn tất.
- `BR-09`: không cho xóa độc giả nếu còn sách chưa trả.
- `BR-10`: sau khi lập phiếu mượn, UI phải phản ánh trạng thái bản sao thành `BORROWED`.
- `BR-11`: khi trả sách, trạng thái phiếu mượn và bản sao phải cập nhật đồng bộ.
- `BR-12`: báo cáo đầu sách mượn nhiều phải tính theo đầu sách, không theo từng bản sao.

---

## 5. Phase roadmap

## Phase 0 – Shared foundation

### Mục tiêu
Tạo bộ khung frontend dùng chung để các module sau chỉ việc cắm vào.

### Phạm vi
- Root layout và protected shell.
- Sidebar/topbar/breadcrumb/page header.
- Chuẩn hóa styling convention với Tailwind CSS làm nền mặc định cho layout và UI spacing.
- Shared UI primitives dựa trên shadcn/ui: button, input, select, textarea, modal, confirm dialog.
- Shared states: loading, empty, error, table, pagination.
- API client nền: bearer token, JSON parsing, error normalization, file download cho PDF.
- Thiết lập query/cache/mutation conventions bằng TanStack Query cho server state.
- Session/auth helpers và permission helpers.
- Thiết lập validation strategy bằng Zod cho auth form, filter form và CRUD form.
- Enum mappers cho `ReaderStatus`, `Gender`, `BookCopyStatus`, `LoanStatus`, `AccountRole`.
- Chuẩn hóa integration giữa API client và query layer để các phase sau không tự fetch rời rạc.

### Deliverables
- App shell cho khu vực protected.
- Shared UI kit cơ bản dựa trên shadcn/ui + Tailwind CSS.
- `lib/api-client`, `lib/auth`, `lib/permissions`, `lib/enums`.
- Query/cache foundation cho API state.
- Validation schema conventions cho form và payload.

### Exit criteria
- Có thể dựng nhanh một page protected với layout chuẩn.
- Có thể gọi API có token và xử lý lỗi theo contract.
- Có một pattern thống nhất cho API loading/error state để các module sau tái sử dụng.
- Có ít nhất một form mẫu được xác định sẽ đi theo schema validation chuẩn.
- Stack foundation được chốt đủ để các phase sau không phải chọn lại styling/UI/query/validation approach.

---

## Phase 1 – Auth, RBAC, dashboard

### Mục tiêu
Hoàn thiện điểm vào hệ thống và điều hướng theo vai trò.

### API liên quan
- `POST /auth/login`

### Phạm vi
- Login page.
- Lưu phiên đăng nhập.
- Route protection cho khu vực protected.
- Dashboard/landing page theo role.
- Unauthorized/access denied state.
- Login form là use case đầu tiên áp dụng validation schema bằng Zod.
- Auth flow là use case đầu tiên áp dụng mutation/error handling pattern theo TanStack Query.
- Dashboard, login và unauthorized state phải tái sử dụng shared UI primitives từ shadcn/ui + Tailwind CSS.

### Điều kiện UI cần thể hiện
- `AUTH_INVALID_CREDENTIALS` hiển thị inline ở form.
- `AUTH_ACCOUNT_INACTIVE` hiển thị rõ lý do bị chặn.
- `ADMIN`, `LIBRARIAN`, `LEADER` nhìn thấy menu khác nhau.
- Client-side validation và hiển thị lỗi inline phải đi theo schema thống nhất.
- Loading/submitting/error state của login phải đi theo API state pattern thống nhất.

### Exit criteria
- Đăng nhập thành công và điều hướng đúng vai trò.
- Không thể truy cập route protected khi chưa có phiên.
- Auth flow đóng vai trò reference implementation đầu tiên cho stack đã chuẩn hóa.

---

## Phase 2 – Danh mục nền nghiệp vụ

### Mục tiêu
Xây xong lớp dữ liệu gốc cho các luồng mượn–trả.

### Thứ tự triển khai
1. Readers
2. Majors
3. Titles
4. Copies

### 2.1 Readers
API:
- `GET /readers`
- `GET /readers/{ma_doc_gia}`
- `POST /readers`
- `PATCH /readers/{ma_doc_gia}`
- `DELETE /readers/{ma_doc_gia}`
- `POST /readers/{ma_doc_gia}/print-card`

Yêu cầu UI:
- Danh sách + filter + pagination.
- Form tạo/sửa độc giả.
- In thẻ thư viện từ endpoint PDF.
- Delete phải xử lý rõ lỗi `BR_09_READER_HAS_UNRETURNED_LOAN`.

### 2.2 Majors
API:
- `GET/POST /majors`
- `GET/PATCH/DELETE /majors/{ma_chuyen_nganh}`

Yêu cầu UI:
- Danh sách CRUD gọn, phục vụ dữ liệu tham chiếu cho đầu sách.

### 2.3 Titles
API:
- `GET/POST /titles`
- `GET/PATCH/DELETE /titles/{ma_dau_sach}`

Yêu cầu UI:
- Form gắn chuyên ngành.
- Hiển thị dữ liệu đầu sách theo góc nhìn domain.
- Không giả định `so_luong_sach` là trường nhập nếu backend coi đó là giá trị suy ra.

### 2.4 Copies
API:
- `GET/POST /copies`
- `GET/PATCH/DELETE /copies/{ma_sach}`

Yêu cầu UI:
- Danh sách bản sao theo `ma_dau_sach`, `tinh_trang`.
- Badge trạng thái rõ cho `AVAILABLE`, `BORROWED`, `DAMAGED`, `LOST`, `NEEDS_REVIEW`.
- Delete phải phản ánh đúng constraint nghiệp vụ.

### Exit criteria
- CRUD các danh mục nền hoạt động ổn định.
- Có thể tạo đủ dữ liệu để đi tiếp sang nghiệp vụ mượn–trả.

---

## Phase 3 – Tra cứu và tác vụ quầy thủ thư

### Mục tiêu
Tối ưu thao tác hằng ngày của thủ thư tại quầy.

### API liên quan
- `GET /search/books`

### Phạm vi
- Trang tra cứu sách theo nhiều tiêu chí.
- Quick actions từ dashboard: tạo độc giả, tra cứu, lập phiếu mượn, trả sách.

### Yêu cầu UI
- Hỗ trợ tra cứu theo mã đầu sách, tên sách, tác giả, chuyên ngành, mã sách, tình trạng.
- Từ kết quả tra cứu có thể điều hướng nhanh sang chi tiết đầu sách/bản sao hoặc luồng mượn.

### Exit criteria
- Thủ thư có thể tìm nhanh sách và đi vào luồng thao tác chỉ qua vài bước.

---

## Phase 4 – Mượn và trả sách

### Mục tiêu
Hoàn thiện core flow của hệ thống.

### API liên quan
- `GET /loans`
- `GET /loans/{id}`
- `POST /loans`
- `PATCH /loans/{id}/return`

### Phạm vi
- Danh sách phiếu mượn.
- Chi tiết phiếu mượn.
- Tạo phiếu mượn.
- Ghi nhận trả sách.

### Yêu cầu UI chính
- Form mượn phải kiểm tra reader và bản sao trước khi submit.
- Nếu độc giả đang có phiếu mượn chưa trả thì phải chặn rõ theo business message.
- Nếu bản sao không ở trạng thái `AVAILABLE` thì disable submit.
- Khi mượn thành công, cập nhật trạng thái bản sao thành `BORROWED` trong UI.
- Khi trả sách:
  - trả về `AVAILABLE` -> loan thành `RETURNED`
  - trả về `DAMAGED`, `LOST`, `NEEDS_REVIEW` -> loan thành `NEEDS_REVIEW`

### Exit criteria
- Luồng mượn–trả hoàn chỉnh từ list -> detail -> action.
- Các rule `BR-04`, `BR-06`, `BR-10`, `BR-11` được phản ánh đúng trên UI.

---

## Phase 5 – Báo cáo

### Mục tiêu
Phục vụ nhu cầu theo dõi vận hành cho thủ thư và lãnh đạo.

### API liên quan
- `GET /reports/top-borrowed-titles`
- `GET /reports/unreturned-readers`

### Phạm vi
- Báo cáo đầu sách được mượn nhiều nhất.
- Báo cáo độc giả chưa trả sách.
- Phân quyền xem cho `LIBRARIAN` và `LEADER`.

### Yêu cầu UI
- Top borrowed phải hiển thị theo đầu sách.
- Unreturned readers phải nhấn mạnh độc giả, sách đang giữ, ngày mượn.
- `LEADER` chỉ thấy dashboard/report scope, không thấy CRUD nghiệp vụ.

### Exit criteria
- Có đủ 2 báo cáo MVP như SRS.

---

## Phase 6 – Quản trị nhân sự và tài khoản

### Mục tiêu
Hoàn thiện khu vực quản trị dành cho `ADMIN`.

### API liên quan
- `GET/POST /staff`
- `GET/PATCH/DELETE /staff/{ma_nhan_vien}`
- `GET/POST /accounts`
- `GET/PATCH/DELETE /accounts/{username}`

### Phạm vi
- CRUD nhân viên.
- CRUD tài khoản.
- Gán role.
- Trạng thái tài khoản/nhân viên.

### Yêu cầu UI
- Tách route/menu admin khỏi librarian.
- Một nhân viên tối đa một tài khoản.
- Role chỉ gồm `ADMIN`, `LIBRARIAN`, `LEADER`.
- Cần hiển thị rõ mối liên kết giữa nhân viên và tài khoản.

### Exit criteria
- Admin có thể quản lý nhân viên và tài khoản đầy đủ theo SRS.

---

## Phase 7 – Hardening và polish

### Mục tiêu
Nâng chất lượng sử dụng và độ ổn định của hệ thống.

### Phạm vi
- `loading.tsx`, `error.tsx`, empty states.
- Confirm flows thống nhất.
- Search params sync URL.
- Validate form tốt hơn.
- Accessibility cơ bản cho form/table/dialog.
- Chuẩn hóa thông báo lỗi nghiệp vụ theo `error.code`.

### Exit criteria
- Trải nghiệm giữa các module nhất quán.
- Các lỗi nghiệp vụ phổ biến hiển thị rõ, dễ hiểu, không mơ hồ.

---

## 6. Trình tự phụ thuộc tổng thể

Thứ tự khuyến nghị khi triển khai:

1. Shared foundation
2. Auth + RBAC + dashboard
3. Readers
4. Majors
5. Titles
6. Copies
7. Search books
8. Loans
9. Reports
10. Staff
11. Accounts
12. Hardening

Lý do:
- `loans` phụ thuộc trực tiếp vào `readers` và `copies`.
- `copies` phụ thuộc `titles`.
- `titles` phụ thuộc `majors`.
- `reports` phụ thuộc dữ liệu từ `loans`.
- `staff/accounts` là domain tách biệt nhưng vẫn cần auth foundation trước.
- Shared foundation phải khóa xong quyết định về Tailwind CSS, shadcn/ui, TanStack Query và Zod trước khi mở rộng sang module nghiệp vụ để tránh refactor hàng loạt.

---

## 7. Rủi ro và lưu ý khi triển khai

- `README.md` hiện vẫn là README mặc định của create-next-app, không phải nguồn nghiệp vụ.
- API query params chưa hoàn toàn đồng nhất giữa các nhóm endpoint (`page_size` và `limit` cùng xuất hiện), nên cần adapter layer ở frontend.
- Endpoint in thẻ thư viện trả `application/pdf`, không đi theo JSON envelope.
- `DAU_SACH.so_luong_sach` trong schema docs là giá trị suy ra, không nên mặc định coi là trường nhập liệu bắt buộc.
- Repo hiện chưa có test runner trong `package.json`; cần ưu tiên lint/build cho giai đoạn đầu, và bổ sung test strategy sau khi kiến trúc frontend ổn định.
- Tailwind CSS đã có trong repo nhưng hiện mới ở mức nền tảng, chưa đủ để coi là design system hoàn chỉnh.
- TanStack Query, shadcn/ui và Zod hiện chưa được cài đặt/cấu hình; đây phải được xử lý như foundation work tập trung, không nên thêm rải rác theo từng feature.
- Nếu không khóa stack từ planning, các phase sau dễ trộn nhiều pattern fetch, form validation và UI primitives, làm tăng chi phí refactor.

---

## 8. Kết luận

Roadmap phù hợp nhất cho repo hiện tại là đi từ **shared foundations trước, nghiệp vụ sau**. Sau khi hoàn thiện auth, app shell, API client và permission layer, triển khai theo chuỗi phụ thuộc domain: **độc giả + danh mục sách -> mượn–trả -> báo cáo -> quản trị tài khoản**. Cách đi này giảm refactor, bám sát tài liệu nguồn, và phù hợp với trạng thái hiện tại của codebase.

Nền tảng frontend được chuẩn hóa theo **Tailwind CSS + shadcn/ui + TanStack Query + Zod** để đảm bảo tính nhất quán cho styling, UI primitives, API state và validation ngay từ Phase 0.
