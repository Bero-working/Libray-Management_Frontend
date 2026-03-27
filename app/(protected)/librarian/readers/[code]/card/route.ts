import { apiRequestRaw } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-errors";
import { readerEndpoints } from "@/lib/api/endpoints";
import { getSession } from "@/lib/auth/auth.session";

function buildFallbackDisposition(code: string): string {
  const safeCode = code.replace(/[^a-zA-Z0-9_-]+/g, "_");

  return `inline; filename="${safeCode}-library-card.pdf"`;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();

  if (!session) {
    return new Response("Phiên đăng nhập không hợp lệ.", {
      status: 401,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  if (session.sessionData.user.role !== "LIBRARIAN") {
    return new Response("Bạn không có quyền in thẻ thư viện.", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const { code } = await params;

  try {
    const response = await apiRequestRaw(readerEndpoints.printCard(code), {
      method: "POST",
    });
    const headers = new Headers();
    const contentType = response.headers.get("Content-Type");
    const contentDisposition = response.headers.get("Content-Disposition");
    const cacheControl = response.headers.get("Cache-Control");

    headers.set("Content-Type", contentType ?? "application/pdf");
    headers.set(
      "Content-Disposition",
      contentDisposition ?? buildFallbackDisposition(code)
    );

    if (cacheControl) {
      headers.set("Cache-Control", cacheControl);
    }

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return new Response(error.message, {
        status: error.status,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    return new Response("Không thể in thẻ thư viện lúc này.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
