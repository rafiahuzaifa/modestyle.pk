import { currentUser } from "@clerk/nextjs/server";

/** Admin allowlist from ADMIN_EMAILS (comma-separated). */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** The user's primary email, only if Clerk has verified they own it. */
export function verifiedPrimaryEmail(user: ClerkUser): string | undefined {
  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  return primary?.verification?.status === "verified" ? primary.emailAddress : undefined;
}

/** Returns the signed-in Clerk user if they're an admin, otherwise null. */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) return null;
  return isAdminEmail(verifiedPrimaryEmail(user)) ? user : null;
}
