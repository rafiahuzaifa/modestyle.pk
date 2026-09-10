import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, isAdminEmail } from "@/lib/admin";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clerk = await clerkClient();
    const { data } = await clerk.users.getUserList({
      limit: 100,
      orderBy: "-created_at",
    });

    const users = data.map((u) => {
      const email = u.emailAddresses.find(
        (e) => e.id === u.primaryEmailAddressId
      )?.emailAddress;
      return {
        id: u.id,
        email: email || "",
        name: [u.firstName, u.lastName].filter(Boolean).join(" "),
        role: isAdminEmail(email) ? "admin" : "customer",
        created_at: new Date(u.createdAt).toISOString(),
      };
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Admin users error:", err);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}
