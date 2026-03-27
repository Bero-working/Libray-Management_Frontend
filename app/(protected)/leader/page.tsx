import Link from "next/link";

import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/librarian/page-header";
import { StatCard } from "@/components/librarian/stat-card";
import { TopBorrowedTitlesSection } from "@/components/reports/top-borrowed-titles-section";
import { UnreturnedReadersSection } from "@/components/reports/unreturned-readers-section";
import { APP_ROUTES } from "@/lib/config/routes";
import { formatCount } from "@/lib/librarian/presenters";
import { buildHref } from "@/lib/librarian/utils";
import {
  getReportsErrorMessage,
  getTopBorrowedTitles,
  getUnreturnedReaders,
} from "@/lib/reports/data";
import { countOpenLoans, getDefaultReportWindow } from "@/lib/reports/utils";

export default async function LeaderPage() {
  const reportWindow = getDefaultReportWindow(30);
  let topBorrowedTitles;
  let unreturnedReaders;

  try {
    [topBorrowedTitles, unreturnedReaders] = await Promise.all([
      getTopBorrowedTitles({
        from: reportWindow.from,
        to: reportWindow.to,
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
        title="Không thể tải dashboard Leader"
        description={getReportsErrorMessage(error)}
      />
    );
  }

  const reportCenterHref = buildHref(APP_ROUTES.leaderReports, {
    from: reportWindow.from,
    to: reportWindow.to,
  });
  const currentOpenLoanCount = countOpenLoans(unreturnedReaders.items);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leader Reporting"
        title="Bảng điều hành báo cáo"
        description="Theo dõi nhanh circulation hiện tại qua hai báo cáo read-only dành cho lãnh đạo. Mọi dữ liệu đều lấy trực tiếp từ reports API và không hiển thị thao tác nghiệp vụ."
        actions={
          <Link href={reportCenterHref} className="ui-button-primary px-4 py-3 text-sm font-semibold">
            Mở reporting center
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Khoảng theo dõi"
          value={`${reportWindow.from} -> ${reportWindow.to}`}
          hint="Cửa sổ mặc định 30 ngày gần nhất"
          accent="blue"
        />
        <StatCard
          label="Top borrowed titles"
          value={formatCount(topBorrowedTitles.meta.total)}
          hint="Số đầu sách phát sinh lượt mượn trong kỳ"
          accent="teal"
        />
        <StatCard
          label="Độc giả còn loan mở"
          value={formatCount(unreturnedReaders.meta.total)}
          hint="Tổng reader đang xuất hiện trong báo cáo nợ sách"
          accent="amber"
        />
        <StatCard
          label="Phiếu mở trên dashboard"
          value={formatCount(currentOpenLoanCount)}
          hint="Tổng số loan mở của nhóm reader đang hiển thị"
          accent="rose"
        />
      </div>

      <TopBorrowedTitlesSection
        data={topBorrowedTitles}
        description={`Khoảng ${reportWindow.from} đến ${reportWindow.to}`}
        emptyTitle="Chưa có dữ liệu mượn trong kỳ"
        emptyDescription="Báo cáo này sẽ hiển thị khi hệ thống phát sinh giao dịch mượn trong khoảng thời gian đang xét."
        action={
          <Link href={reportCenterHref} className="text-sm font-semibold text-slate-700 hover:text-slate-950">
            Xem báo cáo đầy đủ
          </Link>
        }
      />

      <UnreturnedReadersSection
        data={unreturnedReaders}
        description={`${formatCount(unreturnedReaders.meta.total)} độc giả đang có loan mở`}
        emptyTitle="Không có độc giả nợ sách"
        emptyDescription="Danh sách này sẽ xuất hiện khi hệ thống có loan chưa được hoàn tất trả."
        action={
          <Link href={reportCenterHref} className="text-sm font-semibold text-slate-700 hover:text-slate-950">
            Đi tới reporting center
          </Link>
        }
      />
    </div>
  );
}
