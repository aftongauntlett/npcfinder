import type { InviteCode } from "../../../../lib/inviteCodes";

export function determineCodeStatus(code: InviteCode): {
  status: "inactive" | "expired" | "used" | "active";
  label: string;
  variant: "default" | "warning" | "success";
} {
  const now = new Date();
  const isExpired = code.expires_at && new Date(code.expires_at) < now;
  const isUsedUp = code.current_uses >= code.max_uses;

  if (!code.is_active) {
    return { status: "inactive", label: "Inactive", variant: "default" };
  }

  if (isExpired) {
    return { status: "expired", label: "Expired", variant: "warning" };
  }

  if (isUsedUp) {
    return { status: "used", label: "Used", variant: "default" };
  }

  return { status: "active", label: "Active", variant: "success" };
}
