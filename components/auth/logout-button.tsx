import { logoutAction } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="ui-button-secondary flex w-full px-4 py-3 text-sm font-semibold"
      >
        Đăng xuất
      </button>
    </form>
  );
}
