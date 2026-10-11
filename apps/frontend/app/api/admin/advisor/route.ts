import { adminHandler } from "@/lib/admin-route";
import { latestReport, runAdvisor } from "@/lib/agent/advisor";

export const maxDuration = 60;

/** Latest stored review. */
export async function GET() {
  return adminHandler(async () => ({ report: await latestReport() }));
}

/** Run a fresh review now. */
export async function POST() {
  return adminHandler(async () => ({ report: await runAdvisor() }));
}
