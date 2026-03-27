# API REFERENCE

## 1. Mục tiêu

Tài liệu này đặc tả API cho hệ thống quản lý thư viện, được suy ra từ:

- `docs/SRS.md`
- `docs/DATABASE_SCHEMA.md`

Phạm vi API bao phủ các nghiệp vụ FR-01 -> FR-24 và business rules BR-01 -> BR-12.

---

## 2. Quy ước chung

### 2.1 Base URL

`/api/v1`

### 2.2 Xác thực

- Cơ chế: Bearer token.
- Header bắt buộc cho API bảo vệ:

```http
Authorization: Bearer <access_token>
```

### 2.3 Phân quyền (RBAC)

- `ADMIN`: quản trị nhân viên, tài khoản, phân quyền.
- `LIBRARIAN`: nghiệp vụ thư viện (độc giả, sách, mượn trả, báo cáo).
- `LEADER`: chỉ xem báo cáo.

### 2.4 Content-Type

- Request body: `application/json`
- Response mặc định: `application/json`
- Riêng API in thẻ có thể trả `application/pdf`

### 2.5 Định dạng thời gian

- Kiểu ngày: `YYYY-MM-DD` (ví dụ `2026-03-18`)

### 2.6 Phân trang

Query params chuẩn cho các endpoint có phân trang:

- `page` (mặc định `1`)
- `limit` (mặc định `20`, tối đa `100`)

> Lưu ý: runtime hiện tại mới implement phân trang ở loans API; metadata phân trang được trả bên trong `data`.

### 2.7 Mẫu response thành công cho API phân trang

```json
{
  "success": true,
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2.8 Mẫu response lỗi

```json
{
  "success": false,
  "error": {
    "code": "BR_04_ACTIVE_LOAN_EXISTS",
    "message": "Độc giả đang có phiếu mượn chưa trả"
  }
}
```

### 2.9 Enum chuẩn hoá

> Các enum dưới đây đã được đồng bộ lại theo `prisma/schema.prisma`.

- `DOC_GIA.trang_thai` (ReaderStatus): `ACTIVE`, `LOCKED`, `INACTIVE`
- `DOC_GIA.gioi_tinh` (Gender): `MALE`, `FEMALE`, `OTHER`
- `BAN_SAO_SACH.tinh_trang` (BookCopyStatus): `AVAILABLE`, `BORROWED`, `DAMAGED`, `LOST`, `NEEDS_REVIEW`
- `PHIEU_MUON.tinh_trang` (LoanStatus): `BORROWED`, `RETURNED`, `NEEDS_REVIEW`
- `TAI_KHOAN.role` (AccountRole): `ADMIN`, `LIBRARIAN`, `LEADER`

---

## 3. Danh mục endpoint

> Ký hiệu: `Implemented` = đã có trong runtime hiện tại, `Planned` = mới có trong docs/SRS.

| Nhóm | Endpoint |
|---|---|
| Health | `GET /health` (`Implemented`) |
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` (`Implemented`) |
| Readers | `GET/POST /readers`, `GET/PATCH/DELETE /readers/{ma_doc_gia}`, `POST /readers/{ma_doc_gia}/print-card` (`Implemented`) |
| Majors | `GET/POST /majors`, `GET/PATCH/DELETE /majors/{ma_chuyen_nganh}` (`Implemented`) |
| Titles | `GET/POST /titles`, `GET/PATCH/DELETE /titles/{ma_dau_sach}` (`Implemented`) |
| Copies | `GET/POST /copies`, `GET/PATCH/DELETE /copies/{ma_sach}` (`Implemented`) |
| Loans | `GET /loans`, `GET /loans/{id}`, `POST /loans`, `PATCH /loans/{id}/return` (`Implemented`) |
| Staff | `GET/POST /staff`, `GET/PATCH/DELETE /staff/{ma_nhan_vien}` (`Implemented`) |
| Accounts | `GET/POST /accounts`, `GET/PATCH/DELETE /accounts/{username}` (`Implemented`) |
| Search | `GET /search/books` (`Implemented`) |
| Reports | `GET /reports/top-borrowed-titles`, `GET /reports/unreturned-readers` (`Implemented`) |

---

## 4. Health API

### 4.1 Kiểm tra trạng thái dịch vụ

`GET /health`

- **Quyền:** Public
- **Trạng thái:** `Implemented`

Response `200`:

```json
{
  "success": true,
  "data": {
    "service": "backend",
    "status": "ok",
    "timestamp": "2026-03-19T00:00:00.000Z"
  }
}
```

---

## 5. Auth API

### 5.1 Đăng nhập

`POST /auth/login`

- **Quyền:** Public
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-01, BR-01
- **Rate limit:** `5 request / 60 giây`

Request:

```json
{
  "username": "librarian01",
  "password": "your_password"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt_access_token>",
    "refreshToken": "<jwt_refresh_token>",
    "user": {
      "id": "1",
      "role": "LIBRARIAN",
      "staffCode": "NV001",
      "staffId": "1",
      "username": "librarian01"
    }
  }
}
```

Lỗi thường gặp:

- `401 UNAUTHORIZED` - sai tài khoản/mật khẩu
- `403 FORBIDDEN` - tài khoản hoặc nhân viên không active

### 5.2 Làm mới access token

`POST /auth/refresh`

- **Quyền:** Public
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-01, BR-01
- **Rate limit:** `10 request / 60 giây`

Request:

```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "accessToken": "<new_jwt_access_token>",
    "refreshToken": "<new_jwt_refresh_token>"
  }
}
```

Lỗi thường gặp:

- `401 UNAUTHORIZED` - refresh token không hợp lệ/hết hạn/sai loại token
- `403 FORBIDDEN` - tài khoản không còn active

### 5.3 Đăng xuất

`POST /auth/logout`

- **Quyền:** Public
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-01, BR-01
- **Rate limit:** `10 request / 60 giây`

Request:

```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

Lỗi thường gặp:

- `401 UNAUTHORIZED` - refresh token không hợp lệ
- `403 FORBIDDEN` - tài khoản không còn active

---

## 6. Readers API (DOC_GIA)

### 6.1 Danh sách độc giả

`GET /readers`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-03, FR-05, FR-06
- Runtime hiện tại: trả toàn bộ độc giả chưa soft delete; chưa xử lý query filter/pagination.

### 6.2 Chi tiết độc giả

`GET /readers/{ma_doc_gia}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`

### 6.3 Tạo độc giả/thẻ thư viện

`POST /readers`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-03, BR-02

Request:

```json
{
  "ma_doc_gia": "DG001",
  "ho_ten": "Nguyen Van A",
  "lop": "CNTT-K18",
  "ngay_sinh": "2004-09-10",
  "gioi_tinh": "MALE",
  "trang_thai": "ACTIVE"
}
```

> Lưu ý: `gioi_tinh` và `trang_thai` dùng đúng enum đã chuẩn hoá ở mục 2.9.

Response `201`: trả về bản ghi độc giả vừa tạo.

### 6.4 Cập nhật độc giả

`PATCH /readers/{ma_doc_gia}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-05

### 6.5 Xóa độc giả

`DELETE /readers/{ma_doc_gia}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-06, BR-09

Ràng buộc:

- Không cho xóa nếu độc giả đang có phiếu mượn chưa trả.
- Trả `409 BR_09_READER_HAS_UNRETURNED_LOAN` khi vi phạm.

### 6.6 In thẻ thư viện

`POST /readers/{ma_doc_gia}/print-card`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-04

Response:

- `200 application/pdf` (file thẻ in, không bị JSON envelope bọc ngoài)

---

## 7. Majors API (CHUYEN_NGANH)

### 7.1 Danh sách chuyên ngành

`GET /majors`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-07

### 7.2 Chi tiết chuyên ngành

`GET /majors/{ma_chuyen_nganh}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`

### 7.3 Tạo chuyên ngành

`POST /majors`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-07, BR-02

Request:

```json
{
  "ma_chuyen_nganh": "CN001",
  "ten_chuyen_nganh": "Công nghệ thông tin",
  "mo_ta": "Chuyên ngành CNTT"
}
```

### 7.4 Cập nhật chuyên ngành

`PATCH /majors/{ma_chuyen_nganh}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-07
- Cho phép cập nhật `ten_chuyen_nganh` và/hoặc `mo_ta`.

### 7.5 Xóa chuyên ngành

`DELETE /majors/{ma_chuyen_nganh}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-07
- Không cho xóa nếu còn đầu sách đang tham chiếu.
- Lỗi hiện tại trả `409 CONFLICT` với message `Cannot delete major with active titles`.

---

## 8. Titles API (DAU_SACH)

### 8.1 Danh sách đầu sách

`GET /titles`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-08, FR-09, FR-10
- Trả thêm `so_luong_sach` là giá trị computed từ số bản sao chưa soft delete.

### 8.2 Chi tiết đầu sách

`GET /titles/{ma_dau_sach}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- Trả chi tiết đầu sách cùng `so_luong_sach`.

### 8.3 Tạo đầu sách

`POST /titles`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-08, BR-02

Request:

```json
{
  "ma_dau_sach": "DS001",
  "ten_dau_sach": "Clean Code",
  "nha_xuat_ban": "Prentice Hall",
  "so_trang": 464,
  "kich_thuoc": "16x24 cm",
  "tac_gia": "Robert C. Martin",
  "ma_chuyen_nganh": "CN001"
}
```

### 8.4 Cập nhật đầu sách

`PATCH /titles/{ma_dau_sach}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-09
- Cho phép cập nhật metadata và/hoặc `ma_chuyen_nganh`.

### 8.5 Xóa đầu sách

`DELETE /titles/{ma_dau_sach}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-10, BR-07
- Không cho xóa nếu còn bản sao hoặc loan chưa hoàn tất.
- Trả `409 BR_07_TITLE_HAS_DEPENDENCIES` khi vi phạm.

---

## 9. Copies API (BAN_SAO_SACH)

### 9.1 Danh sách bản sao

`GET /copies`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-11, BR-03
- Runtime hiện tại: trả toàn bộ bản sao chưa soft delete; chưa xử lý query filter/pagination.

### 9.2 Chi tiết bản sao

`GET /copies/{ma_sach}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`

### 9.3 Tạo bản sao

`POST /copies`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-11, BR-02, BR-03

Request:

```json
{
  "ma_sach": "S001",
  "ma_dau_sach": "DS001",
  "tinh_trang": "AVAILABLE",
  "ngay_nhap": "2026-03-01"
}
```

> Lưu ý: `tinh_trang` dùng enum `BookCopyStatus`: `AVAILABLE`, `BORROWED`, `DAMAGED`, `LOST`, `NEEDS_REVIEW`.

### 9.4 Cập nhật bản sao

`PATCH /copies/{ma_sach}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-12
- Cập nhật `tinh_trang` và/hoặc `ngay_nhap`.

### 9.5 Xóa bản sao

`DELETE /copies/{ma_sach}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-13, BR-08
- Không cho xóa nếu bản sao đang mượn hoặc còn gắn với phiếu mượn chưa hoàn tất.

---

## 10. Loans API (PHIEU_MUON)

### 10.1 Danh sách phiếu mượn

`GET /loans`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-15, FR-16, FR-18
- Query hỗ trợ: `ma_doc_gia`, `ma_sach`, `status`, `ngay_muon_from`, `ngay_muon_to`, `page`, `limit`
- Response phân trang trả trong `data` theo dạng:

```json
{
  "success": true,
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 10.2 Chi tiết phiếu mượn

`GET /loans/{id}`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`

### 10.3 Lập phiếu mượn

`POST /loans`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-15, FR-16, FR-17, BR-04, BR-05, BR-06, BR-10

Request:

```json
{
  "ma_doc_gia": "DG001",
  "ma_sach": "S001",
  "ngay_muon": "2026-03-19",
  "ghi_chu_tinh_trang": "Sách còn tốt"
}
```

Ràng buộc:

- Mỗi độc giả tại một thời điểm chỉ được có tối đa 1 phiếu mượn chưa trả.
- Chỉ bản sao có trạng thái `AVAILABLE` mới được cho mượn.
- Khi tạo phiếu mượn thành công, bản sao chuyển sang `BORROWED` trong cùng transaction.
- `ma_thu_thu` được suy ra từ access token của người đang thao tác.

### 10.4 Ghi nhận trả sách

`PATCH /loans/{id}/return`

- **Quyền:** `LIBRARIAN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-18, FR-19, BR-11

Request:

```json
{
  "ngay_tra": "2026-03-20",
  "tinh_trang_sau_tra": "AVAILABLE",
  "ghi_chu_tinh_trang": "Sách trả đúng hẹn"
}
```

Ràng buộc:

- Phiếu mượn đang ở trạng thái chưa trả mới được xử lý trả sách.
- `Loan.status` được cập nhật thành `RETURNED` khi bản sao trả về `AVAILABLE`.
- `Loan.status` được cập nhật thành `NEEDS_REVIEW` khi bản sao trả về trạng thái cần kiểm tra/hỏng/mất.

---

## 11. Reports API

- **Trạng thái:** `Implemented`
- Runtime hiện tại đã có `reports` controller/service cho 2 endpoint báo cáo của phase 5.

### 11.1 Báo cáo đầu sách được mượn nhiều nhất

`GET /reports/top-borrowed-titles`

- **Quyền:** `LIBRARIAN`, `LEADER`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-20, BR-12
- Query hỗ trợ: `from`, `to`, `page`, `limit`
- Giới hạn runtime hiện tại: `page <= 1000`, `limit <= 100`
- Rule date range hiện tại: `from <= to`, đúng định dạng `YYYY-MM-DD`, và khoảng thời gian không vượt quá `366 ngày`.
- Runtime hiện tại aggregate theo đầu sách trong service để đảm bảo đếm theo title, không theo copy.

### 11.2 Báo cáo độc giả chưa trả sách

`GET /reports/unreturned-readers`

- **Quyền:** `LIBRARIAN`, `LEADER`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-21
- Query hỗ trợ: `page`, `limit`
- Giới hạn runtime hiện tại: `page <= 1000`, `limit <= 100`
- Response trả reader-centric rows với `phieu_muon_dang_mo` và `so_phieu_muon_dang_mo`.

---

## 12. Search API

### 12.1 Tra cứu sách

`GET /search/books`

- **Quyền:** `LIBRARIAN`, `LEADER`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-14
- Query hỗ trợ: `page`, `limit`, `ma_dau_sach`, `ten_dau_sach`, `tac_gia`, `ma_chuyen_nganh`, `ma_sach`, `tinh_trang`
- Giới hạn runtime hiện tại: `page <= 1000`, `limit <= 100`
- Runtime hiện tại trả kết quả theo title-centric shape, kèm `ban_sao_phu_hop` và `so_luong_sach`.

---

## 13. Staff API

### 13.1 Danh sách nhân viên

`GET /staff`

- **Quyền:** `ADMIN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-22

### 13.2 Chi tiết nhân viên

`GET /staff/{ma_nhan_vien}`

- **Quyền:** `ADMIN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-22

### 13.3 Tạo nhân viên

`POST /staff`

- **Quyền:** `ADMIN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-22, BR-02

Request:

```json
{
  "code": "NV001",
  "fullName": "Nguyen Van B",
  "contactInfo": "nvb@example.com",
  "status": "ACTIVE"
}
```

### 13.4 Cập nhật nhân viên

`PATCH /staff/{ma_nhan_vien}`

- **Quyền:** `ADMIN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-22
- Cho phép cập nhật `fullName`, `contactInfo`, `status`.

### 13.5 Xóa nhân viên

`DELETE /staff/{ma_nhan_vien}`

- **Quyền:** `ADMIN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-22
- Hành vi hiện tại là soft delete.

---

## 14. Accounts API

### 14.1 Danh sách tài khoản

`GET /accounts`

- **Quyền:** `ADMIN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-23, FR-24

### 14.2 Chi tiết tài khoản

`GET /accounts/{username}`

- **Quyền:** `ADMIN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-23, FR-24

### 14.3 Tạo tài khoản

`POST /accounts`

- **Quyền:** `ADMIN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-23, FR-24, BR-02

Request:

```json
{
  "username": "admin01",
  "password": "password123",
  "role": "ADMIN",
  "staffCode": "NV001",
  "status": "ACTIVE"
}
```

Ghi chú:

- `password` tối thiểu 8 ký tự.
- `staffCode` phải tham chiếu tới nhân viên đang tồn tại và chưa soft delete; runtime hiện tại không kiểm tra thêm `status = ACTIVE` khi tạo account.

### 14.4 Cập nhật tài khoản

`PATCH /accounts/{username}`

- **Quyền:** `ADMIN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-24
- Cho phép cập nhật `role`, `status`, optional `newPassword`.

### 14.5 Xóa tài khoản

`DELETE /accounts/{username}`

- **Quyền:** `ADMIN`
- **Trạng thái:** `Implemented`
- **FR/BR:** FR-23, FR-24
- Hành vi hiện tại là soft delete và xóa `refreshTokenHash`.

---

## 15. HTTP status codes

| Status | Khi nào dùng |
|---|---|
| `200 OK` | Lấy dữ liệu thành công, update thành công, logout thành công, return book thành công |
| `201 Created` | Tạo resource mới thành công |
| `400 Bad Request` | Validation DTO thất bại |
| `401 Unauthorized` | Thiếu bearer token, sai credentials, refresh token không hợp lệ |
| `403 Forbidden` | Sai role hoặc tài khoản không active |
| `404 Not Found` | Không tìm thấy reader/title/copy/loan/staff/account |
| `409 Conflict` | Vi phạm unique constraint hoặc business rule |
| `422 Unprocessable Entity` | Payload hợp lệ cú pháp nhưng không xử lý được theo validation/semantic rule của framework |
| `500 Internal Server Error` | Lỗi nội bộ hoặc lỗi DB không được map cụ thể |

---

## 16. Mapping FR/BR

### FR đã được code hiện tại bao phủ

- Health check nền tảng: `GET /health`
- FR-01: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- FR-02: JWT guard + roles guard cho `ADMIN`, `LIBRARIAN`
- FR-03 -> FR-06: readers API
- FR-07: majors API
- FR-08 -> FR-10: titles API
- FR-11 -> FR-13: copies API
- FR-14: search books API
- FR-15 -> FR-19: loans API
- FR-20, FR-21: reports API
- FR-22 -> FR-24: staff/accounts API

### BR đã được code hiện tại bao phủ

- BR-01: phải đăng nhập trước khi truy cập API bảo vệ
- BR-02: unique code/username ở readers, majors, titles, copies, staff, accounts
- BR-03: bản sao gắn với một đầu sách hợp lệ
- BR-04: mỗi độc giả chỉ có tối đa 1 phiếu mượn chưa trả
- BR-05: một loan gắn với đúng 1 reader và 1 copy
- BR-06: chỉ copy `AVAILABLE` mới được mượn
- BR-07: không xóa đầu sách nếu còn bản sao hoặc loan chưa xử lý
- BR-08: không xóa bản sao nếu còn loan chưa hoàn tất
- BR-09: không xóa độc giả nếu còn sách chưa trả
- BR-10: tạo loan thì copy chuyển sang `BORROWED`
- BR-11: trả sách thì loan chuyển `RETURNED` hoặc `NEEDS_REVIEW`

### Chưa được code hiện tại bao phủ đầy đủ

- FR-25: audit trail theo người thao tác

---

## 17. Ghi chú triển khai

- Base path thực tế là `/api/v1` do app dùng global prefix `api` + URI versioning `v1`.
- `limit` là tên query param chuẩn cho phân trang ở loans, search, và reports; readers/copies trong runtime hiện tại chưa implement filter/pagination dù SRS có mô tả nhu cầu đó.
- Success envelope của API phân trang nằm trong `data.items` và `data.meta`.
- Search hiện trả kết quả theo title-centric shape với `ban_sao_phu_hop`.
- Top borrowed titles hiện aggregate trong service thay vì raw SQL để giữ đúng BR-12 theo runtime hiện tại.
- Các API loan/return trả lỗi nghiệp vụ bằng `409` với mã `BR_04_*`, `BR_06_*`, `BR_11_*`.
- `HttpExceptionFilter` ưu tiên `error.code` từ payload business rule nếu có; với lỗi Prisma unique hiện tại thường trả mã `CONFLICT` cùng message fallback.
- `print-card` trả `application/pdf` nên bypass JSON envelope.
