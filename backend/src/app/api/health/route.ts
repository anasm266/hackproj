import { NextResponse } from "next/server";
import { claudeAvailable, claudeService } from "@/lib/claude";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await claudeService.checkAvailability();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    claudeEnabled: readiness.available,
    claudeConfigured: claudeAvailable,
    claudeLastChecked: new Date(readiness.checkedAt).toISOString(),
    claudeError: readiness.error ?? null
  });
}
