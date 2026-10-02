import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSettings, parseSettingsInput, saveSettings } from "@/lib/settings";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getSettings());
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const parsed = parseSettingsInput(await request.json());
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }
    await saveSettings(parsed);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Save settings error:", err);
    return NextResponse.json({ error: "Could not save settings. Please try again." }, { status: 500 });
  }
}
