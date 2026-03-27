import Link from "next/link";

import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/librarian/page-header";
import { StatCard } from "@/components/librarian/stat-card";
import { ReportPeriodForm } from "@/components/reports/report-period-form";
import { TopBorrowedTitlesSection } from "@/components/reports/top-borrowed-titles-section";
import { UnreturnedReadersSection } from "@/components/reports/unreturned-readers-section";
import { APP_ROUTES } from "@/lib/config/routes";
import { formatCount } from "@/lib/librarian/presenters";
import {
  getReportsErrorMessage,
  getTopBorrowedTitles,
  getUnreturnedReaders,
} from "@/lib/reports/data";
import {
  countOpenLoans,
  readReportSearchParams,
  validateReportWindow,
} from "@/lib/reports/utils";

interface LeaderReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LeaderReportsPage({ searchParams }: LeaderReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = readReportSearchParams(resolvedSearchParams);
  const validationError = validateReportWindow(filters.from, filters.to);

  if (validationError) {
    return <ErrorState title={validationError.title} description={validationError.description} />;
  }

  let topBorrowedTitles;
  let unreturnedReaders;

  try {
    [topBorrowedTitles, unreturnedReaders] = await Promise.all([
      getTopBorrowedTitles({
        from: filters.from,
        to: filters.to,
        page: filters.topPage,
        limit: filters.topLimit,
      }),
      getUnreturnedReaders({
        page: filters.openPage,
        limit: filters.openLimit,
      }),
    ]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải reporting center"
        description={getReportsErrorMessage(error)}
      />
    );
  }

  const currentOpenLoanCount = countOpenLoans(unreturnedReaders.items);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leader Reporting"
        title="Reporting center"
        description="Theo dõi hai báo cáo cốt lõi dành cho lãnh đạo với phạm vi read-only: top borrowed titles theo kỳ và danh sách độc giả còn phiếu mượn mở."
        actions={
          <Link href={APP_ROUTES.leader} className="ui-button-secondary px-4 py-3 text-sm font-semibold">
            Về dashboard leader
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Khoảng ngày"
          value={`${filters.from} -> ${filters.to}`}
          hint="Đang áp dụng cho top borrowed titles"
          accent="blue"
        />
        <StatCard
          label="Đầu sách có lượt mượn"
          value={formatCount(topBorrowedTitles.meta.total)}
          hint="Số title xuất hiện trong kỳ"
          accent="teal"
        />
        <StatCard
          label="Phiếu mở trên trang"
          value={formatCount(currentOpenLoanCount)}
          hint={`${formatCount(unreturnedReaders.meta.total)} độc giả đang có loan mở`}
          accent="amber"
        />
      </div>

      <ReportPeriodForm
        action={APP_ROUTES.leaderReports}
        from={filters.from}
        to={filters.to}
        topLimit={filters.topLimit}
        openLimit={filters.openLimit}
      />

      <TopBorrowedTitlesSection
        data={topBorrowedTitles}
        description={`${formatCount(topBorrowedTitles.meta.total)} title trong kỳ được chọn`}
        emptyTitle="Không có dữ liệu trong kỳ"
        emptyDescription="Thử mở rộng khoảng ngày hoặc chờ thêm giao dịch mượn mới."
        pagination={{
          pathname: APP_ROUTES.leaderReports,
          params: {
            from: filters.from,
            to: filters.to,
            top_limit: filters.topLimit,
            open_page: filters.openPage,
            open_limit: filters.openLimit,
          },
          pageParamName: "top_page",
        }}
      />

      <UnreturnedReadersSection
        data={unreturnedReaders}
        description={`${formatCount(unreturnedReaders.meta.total)} độc giả đang còn loan mở`}
        emptyTitle="Không có độc giả nợ sách"
        emptyDescription="Danh sách này sẽ xuất hiện khi hệ thống có loan chưa được hoàn tất trả."
        pagination={{
          pathname: APP_ROUTES.leaderReports,
          params: {
            from: filters.from,
            to: filters.to,
            top_page: filters.topPage,
            top_limit: filters.topLimit,
            open_limit: filters.openLimit,
          },
          pageParamName: "open_page",
        }}
      />
    </div>
  );
}
