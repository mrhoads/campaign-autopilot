import "server-only";
import type { TenantSanitizerConfig } from "@/lib/tenants/types";

/**
 * Strip references to brand names and overtly national symbolism that the
 * Sora-2 / gpt-image-2 content filters tend to reject.
 *
 * This is a belt-and-suspenders layer on top of the agent-side system prompt
 * rules — even if the LLM slips up and writes a brand name or mascot, the
 * generation API never sees those terms. Brand-specific replacements come
 * from the active tenant; the national-symbolism softening is brand-agnostic.
 */
const DEFAULT_VIDEO_FALLBACK =
  "Cinematic montage of a multigenerational family at golden hour, warm light, gentle camera push-in. (Audio: upbeat, optimistic music.)";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sanitizePromptForGeneration(
  input: string,
  config?: TenantSanitizerConfig,
): string {
  let s = input;

  // Tenant brand-name removals (applied first).
  if (config) {
    for (const { match, replacement } of config.brandReplacements) {
      s = s.replace(new RegExp(match, "gi"), replacement);
    }
  }

  // National symbolism — soften (brand-agnostic).
  s = s.replace(/\bAmerican\s+flags?\b/gi, "festive seasonal decor");
  s = s.replace(/\bUS\s+flags?\b/gi, "festive seasonal decor");
  s = s.replace(/\bU\.S\.\s+flags?\b/gi, "festive seasonal decor");
  s = s.replace(/\bLabor Day\b/gi, "long weekend");
  s = s.replace(/\bpatriotic\b/gi, "celebratory");
  s = s.replace(/\bred,?\s*white,?\s*and\s+blue\b/gi, "warm summer colors");
  s = s.replace(/\bred-white-and-blue\b/gi, "warm summer colors");

  // Collapse any double spaces from substitutions.
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

/**
 * Aggressive sanitizer for the video pipeline only. In addition to the rules
 * above, this removes any sentence referencing the tenant's mascot/character
 * terms, because Sora-2's moderation blocks character + people combinations.
 * Tenants without a mascot supply no terms, so nothing extra is dropped.
 */
export function sanitizePromptForVideo(
  input: string,
  config?: TenantSanitizerConfig,
): string {
  let s = sanitizePromptForGeneration(input, config);

  const mascotTerms = config?.mascotTerms ?? [];
  if (mascotTerms.length) {
    const re = new RegExp(
      `\\b(${mascotTerms.map(escapeRegExp).join("|")})\\b`,
      "i",
    );
    s = s
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => !re.test(sentence))
      .join(" ");
  }

  // If the entire prompt was stripped (rare), provide a safe fallback.
  if (s.trim().length < 40) {
    s = config?.videoFallbackPrompt ?? DEFAULT_VIDEO_FALLBACK;
  }

  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

