import { currentUser } from "@clerk/nextjs/server";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/** Returns the signed-in Clerk user if they're an admin, otherwise null. */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) return null;
  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  return isAdminEmail(email) ? user : null;
}
