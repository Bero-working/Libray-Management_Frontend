import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/librarian/page-header";
import { StatCard } from "@/components/librarian/stat-card";
import { StatusBadge } from "@/components/librarian/status-badge";
import {
  getCopies,
  getLoans,
  getLibrarianErrorMessage,
  getTitles,
  getTopBorrowedTitles,
  getUnreturnedReaders,
} from "@/lib/librarian/data";
import { formatCount, formatDate } from "@/lib/librarian/presenters";
import { APP_ROUTES } from "@/lib/config/routes";

function formatLocalDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate()
  ).padStart(2, "0")}`;
}

function getRecentWindow(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));

  return {
    from: formatLocalDate(from),
    to: formatLocalDate(to),
  };
}

export default async function LibrarianDashboardPage() {
  const reportWindow = getRecentWindow(30);
  let titles;
  let copies;
  let activeLoans;
  let topBorrowedTitles;
  let unreturnedReaders;

  try {
    [titles, copies, activeLoans, topBorrowedTitles, unreturnedReaders] = await Promise.all([
      getTitles(),
      getCopies(),
      getLoans({
        status: "BORROWED",
        page: 1,
        limit: 5,
      }),
      getTopBorrowedTitles({
        ...reportWindow,
        page: 1,
        limit: 5,
      }),
      getUnreturnedReaders({
        page: 1,
        limit: 5,
      }),
    ]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải dashboard Librarian"
        description={getLibrarianErrorMessage(error)}
      />
    );
  }

  const availableCopies = copies.filter((copy) => copy.tinh_trang === "AVAILABLE").length;
  const needsAttention = copies.filter((copy) =>
    ["DAMAGED", "LOST", "NEEDS_REVIEW"].includes(copy.tinh_trang)
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điều phối nghiệp vụ thư viện"
        description="Theo dõi nhanh toàn bộ phase 1 của Librarian: danh mục đầu sách, trạng thái bản sao, luồng mượn trả và các báo cáo vận hành cốt lõi."
        actions={
          <>
            <Link
              href={APP_ROUTES.librarianLoans}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Xử lý mượn / trả
            </Link>
            <Link
              href={APP_ROUTES.librarianSearch}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Tra cứu catalog
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Đầu sách"
          value={formatCount(titles.length)}
          hint="Danh mục title đang hoạt động"
          accent="blue"
        />
        <StatCard
          label="Bản sao sẵn sàng"
          value={formatCount(availableCopies)}
          hint={`${formatCount(copies.length)} bản sao đang được quản lý`}
          accent="teal"
        />
        <StatCard
          label="Phiếu đang mở"
          value={formatCount(activeLoans.meta.total)}
          hint="Tổng số loan trạng thái BORROWED"
          accent="amber"
        />
        <StatCard
          label="Cần xử lý"
          value={formatCount(needsAttention)}
          hint="Bản sao hư hỏng, thất lạc hoặc cần review"
          accent="rose"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Top borrowed titles</h2>
              <p className="text-sm text-slate-500">
                Khoảng {reportWindow.from} đến {reportWindow.to}
              </p>
            </div>
            <Link
              href={APP_ROUTES.librarianReports}
              className="text-sm font-semibold text-slate-700 hover:text-slate-950"
            >
              Mở báo cáo
            </Link>
          </div>
          {topBorrowedTitles.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Hạng</th>
                    <th className="px-5 py-3">Đầu sách</th>
                    <th className="px-5 py-3">Tác giả</th>
                    <th className="px-5 py-3 text-right">Lượt mượn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topBorrowedTitles.items.map((row) => (
                    <tr key={row.ma_dau_sach} className="align-top">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                        #{row.rank}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{row.ten_dau_sach}</p>
                        <p className="text-sm text-slate-500">
                          {row.ma_dau_sach} • {row.ten_chuyen_nganh}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{row.tac_gia}</td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCount(row.so_luot_muon)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="Chưa có dữ liệu mượn"
                description="Báo cáo top borrowed sẽ hiện ngay khi hệ thống có giao dịch trong khoảng thời gian đang xét."
              />
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Readers chưa trả sách</h2>
              <p className="text-sm text-slate-500">
                {formatCount(unreturnedReaders.meta.total)} độc giả đang có phiếu mở
              </p>
            </div>
            <Link
              href={APP_ROUTES.librarianLoans}
              className="text-sm font-semibold text-slate-700 hover:text-slate-950"
            >
              Xem loans
            </Link>
          </div>
          {unreturnedReaders.items.length > 0 ? (
            <div className="space-y-4 p-5">
              {unreturnedReaders.items.map((reader) => (
                <article
                  key={reader.ma_doc_gia}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{reader.ho_ten}</p>
                      <p className="text-sm text-slate-500">
                        {reader.ma_doc_gia} • {reader.lop}
                      </p>
                    </div>
                    <StatusBadge status={reader.trang_thai} />
                  </div>
                  <div className="mt-4 space-y-2">
                    {reader.phieu_muon_dang_mo.slice(0, 2).map((loan) => (
                      <div
                        key={`${reader.ma_doc_gia}-${loan.loan_id}`}
                        className="rounded-2xl border border-white bg-white px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-slate-900">{loan.ten_dau_sach}</p>
                        <p className="text-xs text-slate-500">
                          {loan.ma_sach} • mượn ngày {formatDate(loan.ngay_muon)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="Không có phiếu mượn mở"
                description="Danh sách unreturned readers sẽ xuất hiện tại đây khi có độc giả chưa hoàn tất trả sách."
              />
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Phiếu mượn đang mở gần nhất</h2>
            <p className="text-sm text-slate-500">5 giao dịch BORROWED mới nhất</p>
          </div>
          <Link
            href={APP_ROUTES.librarianLoans}
            className="text-sm font-semibold text-slate-700 hover:text-slate-950"
          >
            Đi tới borrow / return
          </Link>
        </div>
        {activeLoans.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Loan</th>
                  <th className="px-5 py-3">Độc giả</th>
                  <th className="px-5 py-3">Bản sao</th>
                  <th className="px-5 py-3">Thủ thư</th>
                  <th className="px-5 py-3">Ngày mượn</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeLoans.items.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-5 py-4 font-semibold text-slate-900">#{loan.id}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{loan.ma_doc_gia}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{loan.ma_sach}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{loan.ma_thu_thu}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(loan.ngay_muon)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={loan.tinh_trang} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Chưa có loan đang mở"
              description="Khi thủ thư lập phiếu mượn mới, danh sách theo dõi nhanh sẽ xuất hiện tại đây."
            />
          </div>
        )}
      </section>
    </div>
  );
}
