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

> Lưu ý: loans API ở phase 4 hiện dùng `limit`; metadata phân trang được trả bên trong `data`.

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
    "message": "Độc giả đang có phiếu mượn chưa trả",
    "details": {
      "ma_doc_gia": "DG001"
    }
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

| Nhóm | Endpoint |
|---|---|
| Auth | `POST /auth/login` |
| Readers | `GET/POST /readers`, `GET/PATCH/DELETE /readers/{ma_doc_gia}`, `POST /readers/{ma_doc_gia}/print-card` |
| Majors | `GET/POST /majors`, `GET/PATCH/DELETE /majors/{ma_chuyen_nganh}` |
| Titles | `GET/POST /titles`, `GET/PATCH/DELETE /titles/{ma_dau_sach}` |
| Copies | `GET/POST /copies`, `GET/PATCH/DELETE /copies/{ma_sach}` |
| Search | `GET /search/books` |
| Loans | `GET /loans`, `GET /loans/{id}`, `POST /loans`, `PATCH /loans/{id}/return` |
| Reports | `GET /reports/top-borrowed-titles`, `GET /reports/unreturned-readers` |
| Staff | `GET/POST /staff`, `GET/PATCH/DELETE /staff/{ma_nhan_vien}` |
| Accounts | `GET/POST /accounts`, `GET/PATCH/DELETE /accounts/{username}` |

---

## 4. Auth API

### 4.1 Đăng nhập

`POST /auth/login`

- **Quyền:** Public
- **FR/BR:** FR-01, BR-01

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
    "access_token": "<jwt_or_token>",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "username": "librarian01",
      "ma_nhan_vien": "NV001",
      "role": "LIBRARIAN",
      "trang_thai": "ACTIVE"
    }
  }
}
```

Lỗi thường gặp:

- `401 AUTH_INVALID_CREDENTIALS`
- `403 AUTH_ACCOUNT_INACTIVE`

---

## 5. Readers API (DOC_GIA)

### 5.1 Danh sách độc giả

`GET /readers`

- **Quyền:** `LIBRARIAN`
- **FR/BR:** FR-03, FR-05, FR-06
- Query hỗ trợ: `q`, `lop`, `trang_thai`, `page`, `page_size`

### 5.2 Chi tiết độc giả

`GET /readers/{ma_doc_gia}`

- **Quyền:** `LIBRARIAN`

### 5.3 Tạo độc giả/thẻ thư viện

`POST /readers`

- **Quyền:** `LIBRARIAN`
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

### 5.4 Cập nhật độc giả

`PATCH /readers/{ma_doc_gia}`

- **Quyền:** `LIBRARIAN`
- **FR/BR:** FR-05

### 5.5 Xóa độc giả

`DELETE /readers/{ma_doc_gia}`

- **Quyền:** `LIBRARIAN`
- **FR/BR:** FR-06, BR-09

Ràng buộc:

- Không cho xóa nếu độc giả đang có phiếu mượn chưa trả.
- Trả `409 BR_09_READER_HAS_UNRETURNED_LOAN` khi vi phạm.

### 5.6 In thẻ thư viện

`POST /readers/{ma_doc_gia}/print-card`

- **Quyền:** `LIBRARIAN`
- **FR/BR:** FR-04

Response:

- `200 application/pdf` (file thẻ in, không bị JSON envelope bọc ngoài)

---

## 6. Majors API (CHUYEN_NGANH)

_(giữ nguyên nội dung mô tả như hiện tại – không thay đổi enum ở đây vì không liên quan `trang_thai`/`gioi_tinh`/`tinh_trang`)_

---

## 7. Titles API (DAU_SACH)

_(giữ nguyên nội dung, không có field enum cần chỉnh ở đây)_

---

## 8. Copies API (BAN_SAO_SACH)

### 8.1 Danh sách bản sao

`GET /copies`

- **Quyền:** `LIBRARIAN`
- **FR/BR:** FR-11, BR-03
- Query hỗ trợ: `q`, `ma_dau_sach`, `tinh_trang`, `page`, `limit`

### 8.2 Chi tiết bản sao

`GET /copies/{ma_sach}`

- **Quyền:** `LIBRARIAN`

### 8.3 Tạo bản sao

`POST /copies`

- **Quyền:** `LIBRARIAN`
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

### 8.4 Cập nhật bản sao

`PATCH /copies/{ma_sach}`

- **Quyền:** `LIBRARIAN`
- **FR/BR:** FR-12
- Cập nhật `tinh_trang` và/hoặc `ngay_nhap`.

### 8.5 Xóa bản sao

`DELETE /copies/{ma_sach}`

- **Quyền:** `LIBRARIAN`
- **FR/BR:** FR-13, BR-08
- Không cho xóa nếu bản sao đang mượn hoặc còn gắn với phiếu mượn chưa hoàn tất.

---

## 9. Loans API (PHIEU_MUON)

### 9.1 Danh sách phiếu mượn

`GET /loans`

- **Quyền:** `LIBRARIAN`
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

### 9.2 Chi tiết phiếu mượn

`GET /loans/{id}`

- **Quyền:** `LIBRARIAN`

### 9.3 Lập phiếu mượn

`POST /loans`

- **Quyền:** `LIBRARIAN`
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

### 9.4 Ghi nhận trả sách

`PATCH /loans/{id}/return`

- **Quyền:** `LIBRARIAN`
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

## 10. Reports API

_(giữ nguyên nội dung hiện tại của phase 5; chưa mở rộng trong phase 4)_

---

## 11. Staff API

_(giữ nguyên nội dung hiện tại)_

---

## 12. Accounts API

_(giữ nguyên nội dung hiện tại)_

---

## 13. HTTP status codes

_(giữ nguyên nội dung hiện tại)_

---

## 14. Mapping FR/BR

_(giữ nguyên nội dung hiện tại, với các mục FR-15 -> FR-19 và BR-04 -> BR-11 đã được phase 4 bao phủ)_

---

## 15. Ghi chú triển khai

- `limit` là tên query param chuẩn cho phân trang ở phase 4.
- Success envelope của API phân trang nằm trong `data.items` và `data.meta`.
- Các API loan/return trả lỗi nghiệp vụ bằng `409` với mã `BR_04_*`, `BR_06_*`, `BR_11_*`.
- `HttpExceptionFilter` ưu tiên `error.code` từ payload business rule nếu có.
