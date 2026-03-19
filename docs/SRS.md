# SRS – SOFTWARE REQUIREMENTS SPECIFICATION

## Hệ thống Quản lý Thư viện Trường Đại học

**Phiên bản:** 1.0  
**Nguồn:** Biên soạn từ đề bài Vibe Coding 2

> Tài liệu này được viết theo hướng đặc tả rõ ràng, có thể dùng làm AI Agent docs để sinh mã, sinh test case, dựng database và UI wireframe. Các điểm chưa được mô tả trong đề bài được ghi rõ là giả định hoặc kiến nghị triển khai.

## 1. Tổng quan

### 1.1 Mục tiêu

Mục tiêu của hệ thống là hỗ trợ thư viện trường đại học quản lý độc giả, thẻ thư viện, danh mục sách, bản sao sách, nghiệp vụ mượn–trả, thống kê báo cáo và quản trị người dùng đăng nhập.

### 1.2 Phạm vi

- Quản lý thẻ thư viện cho sinh viên/độc giả.
- Quản lý chuyên ngành, đầu sách và từng bản sao sách.
- Quản lý phiếu mượn và nghiệp vụ trả sách.
- Thống kê đầu sách được mượn nhiều nhất và độc giả chưa trả sách.
- Quản lý tài khoản nhân viên thư viện và phân quyền.
- Bắt buộc đăng nhập trước khi sử dụng hệ thống.

### 1.3 Thông tin tóm tắt

| Thuộc tính | Giá trị |
|---|---|
| Nguồn đầu vào | Đề bài “Xây dựng hệ thống quản lý thư viện” |
| Mục tiêu tài liệu | Chuẩn hoá yêu cầu để dùng cho AI Agent / developer / tester |
| Phạm vi hệ thống | Quản lý thẻ thư viện, sách, bản sao sách, chuyên ngành, mượn trả, báo cáo, người dùng |
| Nhóm actor chính | Độc giả (Sinh viên), Thủ thư, Quản trị hệ thống, Lãnh đạo thư viện |

### 1.4 Định nghĩa ngắn

| Thuật ngữ | Diễn giải |
|---|---|
| Độc giả | Sinh viên có thẻ thư viện và được phép mượn sách. |
| Thủ thư | Nhân viên thư viện thực hiện nghiệp vụ thẻ, sách, mượn trả và báo cáo. |
| Quản trị hệ thống | Nhân viên quản lý tài khoản người dùng hệ thống và phân quyền. |
| Đầu sách | Bản mô tả chung của một tựa sách. |
| Bản sao sách | Một cuốn sách vật lý cụ thể thuộc một đầu sách. |
| Phiếu mượn | Bản ghi nghiệp vụ cho việc mượn một cuốn sách. |

## 2. Phân tích actor

Theo định nghĩa use case, actor là vai trò tương tác với hệ thống để đạt một mục tiêu nghiệp vụ. Từ đề bài, hệ thống có 4 actor nghiệp vụ chính.

### 2.1 Nhận xét actor

- Độc giả là actor nghiệp vụ ngoài hệ thống; phần lớn thao tác được thực hiện gián tiếp qua thủ thư.
- Thủ thư là actor thao tác trực tiếp nhiều nhất và sở hữu hầu hết use case cốt lõi.
- Quản trị hệ thống chỉ phụ trách quản trị người dùng và phân quyền, cần tách khỏi nghiệp vụ thư viện để đảm bảo kiểm soát.
- Lãnh đạo thư viện chủ yếu nhận báo cáo, có thể được triển khai như vai trò xem báo cáo hoặc nhận file xuất.

### 2.2 Bảng actor

| Actor | Mục tiêu | Quyền chính | Dữ liệu tác động | Ghi chú |
|---|---|---|---|---|
| Độc giả (Sinh viên) | Mượn và trả sách thông qua thủ thư | Yêu cầu cấp thẻ; tra cứu/tìm sách; cung cấp thông tin mượn; trả sách | Thông tin thẻ; trạng thái mượn | Không thao tác trực tiếp trên hệ thống trong đề bài, nhưng là actor nghiệp vụ. |
| Thủ thư | Vận hành nghiệp vụ thư viện hằng ngày | Quản lý thẻ; quản lý chuyên ngành/đầu sách/bản sao; lập phiếu mượn; ghi nhận trả; lập báo cáo | Độc giả, sách, phiếu mượn, báo cáo | Actor chính của hệ thống. |
| Quản trị hệ thống | Quản trị tài khoản và phân quyền người dùng | Tạo/sửa/xóa nhân viên thư viện; tạo tài khoản; cấp quyền | Người dùng hệ thống, vai trò | Không tham gia mượn trả. |
| Lãnh đạo thư viện | Nhận thông tin phục vụ quản lý | Xem/nhận báo cáo thống kê | Báo cáo tổng hợp | Có thể chỉ là actor nhận kết quả, không cần màn hình riêng ở MVP. |

## 3. Danh mục use case theo actor

| Mã UC | Tên use case | Actor chính | Mục tiêu |
|---|---|---|---|
| UC-01 | Đăng nhập | Thủ thư / Quản trị | Xác thực người dùng trước khi thao tác |
| UC-02 | Tạo thẻ thư viện | Thủ thư | Cấp mới độc giả/thẻ thư viện |
| UC-03 | Cập nhật thẻ thư viện | Thủ thư | Sửa sai thông tin độc giả |
| UC-04 | Xóa thẻ thư viện | Thủ thư | Loại bỏ độc giả khỏi thư viện |
| UC-05 | Quản lý chuyên ngành | Thủ thư | Thêm/sửa/xóa danh mục chuyên ngành |
| UC-06 | Quản lý đầu sách | Thủ thư | Thêm/sửa/xóa thông tin đầu sách |
| UC-07 | Quản lý bản sao sách | Thủ thư | Thêm/sửa/xóa từng cuốn sách vật lý |
| UC-08 | Tra cứu sách | Độc giả / Thủ thư | Tìm sách theo đầu sách/chuyên ngành/tình trạng |
| UC-09 | Lập phiếu mượn | Thủ thư | Ghi nhận mượn 1 cuốn sách cho 1 độc giả |
| UC-10 | Ghi nhận trả sách | Thủ thư | Cập nhật trạng thái trả sách cho phiếu mượn |
| UC-11 | Thống kê đầu sách mượn nhiều | Thủ thư | Tạo báo cáo đầu sách được mượn nhiều nhất |
| UC-12 | Thống kê độc giả chưa trả | Thủ thư | Tạo báo cáo độc giả chưa trả sách |
| UC-13 | Quản lý nhân viên thư viện | Quản trị hệ thống | Thêm/sửa/xóa thông tin nhân viên thư viện |
| UC-14 | Tạo tài khoản và cấp quyền | Quản trị hệ thống | Tạo user đăng nhập và gán vai trò |

## 4. Mô tả nghiệp vụ tổng quát

- Sinh viên muốn mượn sách phải có thẻ thư viện hợp lệ.
- Thẻ thư viện được thủ thư nhập vào hệ thống và in để giao cho sinh viên.
- Sách được quản lý theo 2 mức: đầu sách và bản sao sách.
- Một đầu sách có thể có nhiều bản sao; mỗi bản sao có mã sách riêng và tình trạng riêng.
- Mỗi lần mượn, một độc giả chỉ được mượn một cuốn sách.
- Khi mượn sách, thủ thư giữ lại thẻ của độc giả và giao sách.
- Khi trả sách, thủ thư cập nhật tình trạng trả cho phiếu mượn.
- Người dùng phải đăng nhập trước khi sử dụng hệ thống.

## 5. Yêu cầu chức năng chi tiết

| Mã FR | Nhóm chức năng | Mô tả yêu cầu |
|---|---|---|
| FR-01 | Xác thực | Hệ thống phải cho phép thủ thư và quản trị đăng nhập bằng tài khoản hợp lệ trước khi sử dụng chức năng. |
| FR-02 | Phân quyền | Hệ thống phải giới hạn chức năng theo vai trò: Thủ thư chỉ dùng nghiệp vụ thư viện; Quản trị chỉ dùng quản trị người dùng; Lãnh đạo thư viện chỉ xem báo cáo nếu có tài khoản. |
| FR-03 | Độc giả | Hệ thống phải cho phép thủ thư tạo thẻ thư viện gồm: Mã độc giả, Họ tên, Lớp, Ngày sinh, Giới tính. |
| FR-04 | Độc giả | Sau khi tạo thẻ thành công, hệ thống phải hỗ trợ in thẻ thư viện. |
| FR-05 | Độc giả | Hệ thống phải cho phép thủ thư sửa thông tin thẻ khi có sai sót. |
| FR-06 | Độc giả | Hệ thống phải cho phép thủ thư xóa thẻ thư viện khi độc giả bị loại bỏ khỏi thư viện. |
| FR-07 | Danh mục | Hệ thống phải cho phép thêm/sửa/xóa chuyên ngành gồm: Mã chuyên ngành, Tên chuyên ngành, Mô tả. |
| FR-08 | Sách | Hệ thống phải cho phép thêm đầu sách gồm: Mã đầu sách, Tên đầu sách, Nhà xuất bản, Số trang, Kích thước, Tác giả, Số lượng sách, Chuyên ngành. |
| FR-09 | Sách | Hệ thống phải cho phép sửa thông tin đầu sách. |
| FR-10 | Sách | Hệ thống phải cho phép xóa đầu sách khi không còn sử dụng, theo điều kiện dữ liệu hợp lệ. |
| FR-11 | Bản sao | Hệ thống phải cho phép thêm bản sao sách gồm: Mã đầu, Mã sách, Tình trạng, Ngày nhập. |
| FR-12 | Bản sao | Hệ thống phải cho phép sửa thông tin bản sao sách. |
| FR-13 | Bản sao | Hệ thống phải cho phép xóa bản sao sách theo điều kiện dữ liệu hợp lệ. |
| FR-14 | Tra cứu | Hệ thống phải cho phép tìm sách theo mã đầu sách, tên sách, tác giả, chuyên ngành, mã sách và tình trạng. |
| FR-15 | Mượn sách | Trước khi lập phiếu mượn, hệ thống phải kiểm tra độc giả có thẻ hợp lệ, không có khoản mượn chưa trả, và bản sao sách đang sẵn sàng cho mượn. |
| FR-16 | Mượn sách | Hệ thống phải cho phép thủ thư lập phiếu mượn gồm: Mã sách, Mã độc giả, Mã thủ thư cho mượn, Ngày mượn, Tình trạng. |
| FR-17 | Mượn sách | Khi lập phiếu mượn thành công, hệ thống phải chuyển tình trạng bản sao sách sang `Đang mượn`. |
| FR-18 | Trả sách | Hệ thống phải cho phép thủ thư thực hiện trả sách và cập nhật tình trạng trả cho phiếu mượn. |
| FR-19 | Trả sách | Khi trả sách, hệ thống phải cập nhật lại tình trạng bản sao sách theo thực trạng kiểm tra: sẵn sàng / hư hỏng / mất / cần xử lý. |
| FR-20 | Báo cáo | Hệ thống phải tạo được báo cáo các đầu sách được mượn nhiều nhất trong kỳ. |
| FR-21 | Báo cáo | Hệ thống phải tạo được danh sách độc giả đang có phiếu mượn chưa hoàn tất. |
| FR-22 | Quản trị người dùng | Hệ thống phải cho phép quản trị thêm/sửa/xóa thông tin nhân viên thư viện. |
| FR-23 | Quản trị người dùng | Hệ thống phải cho phép quản trị tạo tài khoản đăng nhập cho nhân viên thư viện. |
| FR-24 | Quản trị người dùng | Hệ thống phải cho phép quản trị gán vai trò cho tài khoản người dùng. |
| FR-25 | Hệ thống | Hệ thống nên lưu thời gian tạo/cập nhật và người thao tác cho các bản ghi chính để phục vụ truy vết. |

## 6. Business rules

| Mã BR | Nội dung |
|---|---|
| BR-01 | Người dùng phải đăng nhập thành công trước khi truy cập bất kỳ chức năng nào. |
| BR-02 | Mã độc giả, mã chuyên ngành, mã đầu sách, mã sách, mã nhân viên và tài khoản đăng nhập là duy nhất. |
| BR-03 | Một đầu sách có thể có nhiều bản sao sách; mỗi bản sao chỉ thuộc một đầu sách. |
| BR-04 | Một độc giả tại một thời điểm chỉ được có tối đa 01 phiếu mượn chưa trả. |
| BR-05 | Một phiếu mượn chỉ gắn với đúng 01 bản sao sách và 01 độc giả. |
| BR-06 | Chỉ bản sao sách có tình trạng sẵn sàng mới được phép cho mượn. |
| BR-07 | Không được xóa đầu sách nếu còn bản sao sách đang tồn tại hoặc còn phát sinh giao dịch chưa xử lý. |
| BR-08 | Không được xóa bản sao sách nếu đang ở trạng thái mượn hoặc đang gắn với phiếu mượn chưa hoàn tất. |
| BR-09 | Không được xóa thẻ thư viện nếu độc giả đang có sách chưa trả; trong triển khai thực tế nên khóa thẻ thay vì xóa cứng. |
| BR-10 | Khi lập phiếu mượn thành công, tình trạng bản sao phải đồng bộ sang trạng thái đang mượn. |
| BR-11 | Khi ghi nhận trả sách, phiếu mượn phải chuyển sang trạng thái đã trả hoặc trạng thái xử lý phù hợp. |
| BR-12 | Báo cáo đầu sách mượn nhiều nhất được tính theo số lượt mượn của đầu sách, không tính theo bản sao. |

## 7. Mô hình dữ liệu khái niệm

| Thực thể | Thuộc tính chính | Quan hệ chính | Ghi chú |
|---|---|---|---|
| DOC_GIA | ma_doc_gia, ho_ten, lop, ngay_sinh, gioi_tinh, trang_thai | 1 độc giả có nhiều phiếu mượn theo thời gian | Nên có trạng thái: hoạt động / khóa / ngừng. |
| CHUYEN_NGANH | ma_chuyen_nganh, ten_chuyen_nganh, mo_ta | 1 chuyên ngành có nhiều đầu sách | Danh mục phân loại. |
| DAU_SACH | ma_dau_sach, ten_dau_sach, nha_xuat_ban, so_trang, kich_thuoc, tac_gia, so_luong_sach, ma_chuyen_nganh | 1 đầu sách có nhiều bản sao | `so_luong_sach` có thể suy ra từ số bản sao thực tế. |
| BAN_SAO_SACH | ma_sach, ma_dau_sach, tinh_trang, ngay_nhap | Nhiều bản sao thuộc 1 đầu sách; 1 bản sao có nhiều lịch sử mượn | Tình trạng nên chuẩn hóa enum. |
| PHIEU_MUON | id, ma_sach, ma_doc_gia, ma_thu_thu, ngay_muon, tinh_trang, ngay_tra | Nhiều phiếu mượn theo thời gian | Nên thêm `ngay_tra` và `ghi_chu_tinh_trang` khi triển khai. |
| NHAN_VIEN | ma_nhan_vien, ho_ten, thong_tin_lien_he, trang_thai | 1 nhân viên có thể gắn 1 tài khoản | Bao gồm thủ thư/quản trị. |
| TAI_KHOAN | username, password_hash, role, ma_nhan_vien, trang_thai | 1 tài khoản thuộc 1 nhân viên | Role: `ADMIN` / `LIBRARIAN` / `LEADER`. |

## 8. Use case mô tả ngắn theo actor

### 8.1 Actor: Thủ thư

#### Quản lý thẻ thư viện
- **Tiền điều kiện:** đã đăng nhập với vai trò thủ thư.
- **Hậu điều kiện:** bản ghi độc giả được tạo/cập nhật/xóa hợp lệ; có thể in thẻ sau khi tạo.
- **Luồng chính:** nhập thông tin độc giả → hệ thống kiểm tra dữ liệu → lưu → thông báo thành công → tùy chọn in thẻ.

#### Quản lý sách
- Bao gồm quản lý chuyên ngành, đầu sách và bản sao sách.
- **Luồng chính:** chọn danh mục → thêm/sửa/xóa → hệ thống kiểm tra ràng buộc → lưu dữ liệu.
- **Điểm cần chú ý:** không xóa bản ghi đang ràng buộc nghiệp vụ.

#### Lập phiếu mượn
- **Tiền điều kiện:** độc giả có thẻ hợp lệ; không có sách chưa trả; bản sao sách còn sẵn.
- **Luồng chính:** nhận yêu cầu mượn → tìm bản sao sách → nhập mã độc giả và mã sách → hệ thống kiểm tra điều kiện → lưu phiếu mượn → cập nhật tình trạng sách → hoàn tất.
- **Luồng ngoại lệ:** thẻ không hợp lệ / độc giả đang mượn sách / sách không sẵn sàng.

#### Ghi nhận trả sách
- **Tiền điều kiện:** tồn tại phiếu mượn đang mở.
- **Luồng chính:** nhập/tìm phiếu mượn → xác nhận trả sách → cập nhật tình trạng phiếu mượn → cập nhật tình trạng bản sao sách.
- **Luồng ngoại lệ:** không tìm thấy phiếu mượn mở tương ứng.

#### Lập báo cáo
- Chọn loại báo cáo và kỳ báo cáo → hệ thống tổng hợp dữ liệu → hiển thị hoặc xuất báo cáo.

### 8.2 Actor: Quản trị hệ thống

#### Quản lý nhân viên thư viện
- **Tiền điều kiện:** đã đăng nhập với vai trò quản trị.
- **Luồng chính:** thêm/sửa/xóa thông tin nhân viên → lưu dữ liệu.
- **Luồng ngoại lệ:** không được xóa nhân viên còn ràng buộc tài khoản hoặc phát sinh giao dịch nếu hệ thống áp dụng quy tắc này.

#### Tạo tài khoản và cấp quyền
- Nhập thông tin tài khoản → thiết lập mật khẩu → gán nhân viên → gán vai trò → kích hoạt tài khoản.
- Quyền tối thiểu: `ADMIN`, `LIBRARIAN`, `LEADER` (nếu triển khai màn hình lãnh đạo).

### 8.3 Actor: Độc giả

- Yêu cầu cấp thẻ thư viện.
- Tra cứu/tìm sách trong thư viện.
- Yêu cầu mượn sách bằng cách cung cấp mã sách và mã độc giả cho thủ thư.
- Trả sách cho thủ thư.

## 9. Yêu cầu phi chức năng

| Mã NFR | Nhóm | Mô tả |
|---|---|---|
| NFR-01 | Bảo mật | Mật khẩu phải được lưu dưới dạng băm; phiên đăng nhập phải có timeout. |
| NFR-02 | Toàn vẹn dữ liệu | Dữ liệu mã định danh phải duy nhất; các cập nhật nghiệp vụ phải đảm bảo tính nhất quán. |
| NFR-03 | Khả dụng | Giao diện phải đơn giản để thủ thư thao tác nhanh tại quầy. |
| NFR-04 | Hiệu năng | Tra cứu sách và độc giả trong dữ liệu quy mô nhỏ–trung bình nên phản hồi trong vòng vài giây. |
| NFR-05 | Khả năng kiểm thử | Mỗi chức năng phải có đầu vào/đầu ra rõ ràng để AI Agent có thể sinh test case tự động. |
| NFR-06 | Khả năng mở rộng | Thiết kế nên cho phép mở rộng nhiều sách trên một lần mượn ở các phiên bản sau. |
| NFR-07 | Khả năng audit | Nên lưu log tạo/sửa/xóa cho dữ liệu quan trọng. |

## 10. Danh sách màn hình UI đề xuất

| Mã UI | Tên màn hình | Mục đích |
|---|---|---|
| UI-01 | Đăng nhập | Username, password, nút đăng nhập |
| UI-02 | Dashboard | Điều hướng nhanh theo vai trò |
| UI-03 | Quản lý độc giả/thẻ thư viện | Danh sách + form thêm/sửa + in thẻ |
| UI-04 | Quản lý chuyên ngành | Danh sách + form CRUD |
| UI-05 | Quản lý đầu sách | Danh sách + form CRUD + bộ lọc |
| UI-06 | Quản lý bản sao sách | Danh sách + form CRUD + trạng thái |
| UI-07 | Tra cứu sách | Tìm kiếm theo mã/tên/tác giả/chuyên ngành/tình trạng |
| UI-08 | Lập phiếu mượn | Nhập mã độc giả, mã sách, kiểm tra điều kiện |
| UI-09 | Trả sách | Tìm phiếu mượn đang mở và xác nhận trả |
| UI-10 | Báo cáo thống kê | Báo cáo đầu sách mượn nhiều; độc giả chưa trả |
| UI-11 | Quản lý nhân viên thư viện | Danh sách + form CRUD |
| UI-12 | Quản lý tài khoản & phân quyền | Tạo tài khoản, reset mật khẩu, gán quyền |

## 11. Tiêu chí chấp nhận mức MVP

- Đăng nhập phân quyền đúng theo vai trò.
- Thủ thư tạo, sửa, xóa và in thẻ thư viện được.
- Thủ thư quản lý được chuyên ngành, đầu sách và bản sao sách.
- Hệ thống ngăn không cho một độc giả mượn quá 1 cuốn tại cùng thời điểm.
- Thủ thư lập phiếu mượn thành công và tình trạng sách đổi sang đang mượn.
- Thủ thư ghi nhận trả sách thành công và tình trạng sách được cập nhật lại.
- Sinh được 2 báo cáo: đầu sách mượn nhiều nhất; độc giả chưa trả sách.
- Quản trị tạo được nhân viên, tài khoản và phân quyền.

## 12. Giả định và điểm cần xác nhận thêm

- Đề bài chưa nêu thời hạn mượn và quy định phạt quá hạn; hiện tại chưa đưa vào phạm vi bắt buộc.
- Đề bài nói “xóa” dữ liệu; trong triển khai thực tế nên ưu tiên khóa/ẩn thay vì xóa cứng để giữ lịch sử.
- Đề bài chưa mô tả độc giả có tự đăng nhập hay không; tài liệu này xem độc giả là actor nghiệp vụ gián tiếp.
- Báo cáo có thể hiển thị trên màn hình và/hoặc xuất file PDF/Excel ở giai đoạn sau.
- Thông tin nhân viên thư viện trong đề bài chưa mô tả đầy đủ thuộc tính; có thể bổ sung họ tên, email, số điện thoại, trạng thái.

## 13. Gợi ý triển khai cho AI Agent

- Ưu tiên sinh mã theo module: `auth` → `readers` → `categories` → `titles` → `copies` → `loans` → `reports` → `admin_users`.
- Sinh migration/database schema trước, sau đó sinh API/Service, cuối cùng sinh UI và test.
- Mọi API tạo/sửa/xóa phải kiểm tra business rules `BR-01` đến `BR-12`.
- Nên sinh test case theo `FR` và `BR` để tránh thiếu kiểm thử ràng buộc nghiệp vụ.
- Nên chuẩn hóa enum tình trạng sách và tình trạng phiếu mượn ngay từ đầu để tránh sai khác dữ liệu.

## 14. Phụ lục A – Ma trận actor và quyền

| Chức năng | Độc giả | Thủ thư | Quản trị | Lãnh đạo |
|---|---|---|---|---|
| Đăng nhập | — | R | R | R* |
| Quản lý thẻ thư viện | Gửi yêu cầu | CRUD | — | — |
| Tra cứu sách | Yêu cầu/tra cứu | R | — | R |
| Quản lý chuyên ngành | — | CRUD | — | — |
| Quản lý đầu sách | — | CRUD | — | — |
| Quản lý bản sao sách | — | CRUD | — | — |
| Lập phiếu mượn | Yêu cầu mượn | Create | — | — |
| Ghi nhận trả sách | Trả sách | Update | — | — |
| Báo cáo thống kê | Nhận thông tin | Create/View | — | View |
| Quản lý nhân viên | — | — | CRUD | — |
| Tài khoản & phân quyền | — | — | CRUD | — |

> `R*`: chỉ áp dụng nếu triển khai tài khoản cho vai trò Lãnh đạo.

## 15. Phụ lục B – Nguồn và căn cứ

Tài liệu được phân tích từ đề bài **“BÀI TẬP VIBE CODING 2 – Xây dựng hệ thống quản lý thư viện”** do người dùng cung cấp. Cấu trúc actor/use case bám theo nguyên lý business analysis và use case modelling.

---

**Hết tài liệu.**