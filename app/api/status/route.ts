import { NextResponse } from "next/server";
import { getCapabilities, getAzureConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const caps = getCapabilities();
  const cfg = getAzureConfig();
  return NextResponse.json({
    capabilities: caps,
    endpointConfigured: Boolean(cfg.endpoint),
    chatDeployment: cfg.chatDeployment || null,
    imageDeployment: cfg.imageDeployment || null,
    videoDeployment: cfg.videoDeployment || null,
  });
}
