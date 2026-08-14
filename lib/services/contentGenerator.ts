import type { CampaignBrief, CampaignChannel, ContentVariant } from "@/types";
import { getActiveTenant, getActiveTenantId } from "@/lib/tenants/active";
import { generateId } from "@/lib/utils";
import { getClientCapabilities } from "./status";

/**
 * Content Generator client.
 *
 * Real path: POST /api/content -> GPT-4o channel-specific generation.
 * Fallback path: reuses the active tenant's seeded copy.
 */

const latency = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listSeedVariants(): Promise<ContentVariant[]> {
  return getActiveTenant().content.contentVariants;
}

export async function generateVariant(
  brief: CampaignBrief,
  channel: CampaignChannel,
  seedIndex = 0,
): Promise<ContentVariant> {
  const caps = await getClientCapabilities();
  if (caps.chat) {
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: getActiveTenantId(),
          brief,
          channel,
          variationHint:
            seedIndex === 0
              ? undefined
              : `This is variant #${seedIndex + 1}. Take a meaningfully different angle than prior variants — different audience emphasis or different creative hook.`,
        }),
      });
      if (!res.ok) throw new Error(`Content HTTP ${res.status}`);
      const v = (await res.json()) as ContentVariant;
      return v;
    } catch (e) {
      console.warn("[content] falling back to mock:", e);
    }
  }
  return mockVariant(brief, channel, seedIndex);
}

export async function generateChannelSet(
  brief: CampaignBrief,
  channel: CampaignChannel,
  count = 2,
): Promise<ContentVariant[]> {
  const results: ContentVariant[] = [];
  for (let i = 0; i < count; i++) {
    results.push(await generateVariant(brief, channel, i));
  }
  return results;
}

async function mockVariant(
  brief: CampaignBrief,
  channel: CampaignChannel,
  seedIndex: number,
): Promise<ContentVariant> {
  await latency(700 + Math.random() * 400);

  // Reuse the active tenant's on-brand seed copy so the fallback stays
  // brand-correct and compliance-safe for whichever customer is selected.
  const variants = getActiveTenant().content.contentVariants;
  const pool = variants.filter((v) => v.channel === channel);
  const base = pool.length
    ? pool[seedIndex % pool.length]
    : variants[seedIndex % variants.length];

  return {
    ...base,
    id: generateId("cv"),
    channel,
    label: `${channel} • Variant ${String.fromCharCode(65 + (seedIndex % 5))}`,
    audienceNote: `Calibrated for ${brief.audiences[0]?.label ?? "the primary audience"}.`,
  };
}
