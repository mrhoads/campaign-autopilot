import "server-only";
import { DefaultAzureCredential, type TokenCredential } from "@azure/identity";
import { getAzureConfig, type AzureConfig } from "@/lib/config";

/**
 * Thin, audit-friendly Azure OpenAI / Foundry client.
 *
 * Authentication:
 *  - Primary: Microsoft Entra ID (Azure AD) via DefaultAzureCredential.
 *    Picks up your `az login` credentials, managed identity, or environment
 *    variables (AZURE_CLIENT_ID + AZURE_CLIENT_SECRET + AZURE_TENANT_ID).
 *  - Fallback: API key, if AZURE_OPENAI_API_KEY is set.
 *
 *  Many enterprise Foundry tenants disable API keys entirely, so Entra ID is
 *  the right default. The user (or their app) needs the role
 *  "Cognitive Services OpenAI User" (or higher) on the resource.
 *
 * Supports two endpoint shapes:
 *
 *  1. CLASSIC Azure OpenAI:
 *       https://<resource>.openai.azure.com
 *     -> {endpoint}/openai/deployments/<deployment>/chat/completions
 *        ?api-version=<x>
 *
 *  2. NEW Azure AI Foundry v1 API:
 *       https://<resource>.openai.azure.com/openai/v1
 *     -> {endpoint}/chat/completions?api-version=preview
 *        body includes "model": "<deployment>"
 *
 * Detection is automatic.
 */

export class AzureOpenAIError extends Error {
  status: number;
  detail?: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "AzureOpenAIError";
    this.status = status;
    this.detail = detail;
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
}

function requireConfig(cfg: AzureConfig) {
  if (!cfg.endpoint) {
    throw new AzureOpenAIError(
      "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT.",
      503,
    );
  }
  if (!cfg.apiKey) {
    // We'll try Entra ID — no error here.
  }
}

/** Is the configured endpoint the Foundry v1 API? */
function isV1(cfg: AzureConfig): boolean {
  return /\/openai\/v1\/?$/.test(cfg.endpoint);
}

/** Returns base url with no trailing slash. */
function baseUrl(cfg: AzureConfig): string {
  return cfg.endpoint.replace(/\/+$/, "");
}

/** Helper: build a URL with query params. */
function buildUrl(base: string, path: string, qs: Record<string, string>) {
  const params = new URLSearchParams(qs).toString();
  return `${base}${path}${params ? `?${params}` : ""}`;
}

// ---------------------------------------------------------------------------
// Entra ID token acquisition (cached)
// ---------------------------------------------------------------------------

const COGNITIVE_SCOPE = "https://cognitiveservices.azure.com/.default";

let credential: TokenCredential | undefined;
let cachedToken: { token: string; expiresOnTimestamp: number } | undefined;

function getCredential(): TokenCredential {
  if (!credential) {
    credential = new DefaultAzureCredential();
  }
  return credential;
}

/** Returns a bearer token, caching until ~5 min before expiry. */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresOnTimestamp - now > 5 * 60 * 1000) {
    return cachedToken.token;
  }
  const cred = getCredential();
  const result = await cred.getToken(COGNITIVE_SCOPE);
  if (!result) {
    throw new AzureOpenAIError(
      "Unable to acquire an Entra ID token. Run `az login` (or set AZURE_CLIENT_ID/SECRET/TENANT_ID env vars) and ensure your identity has the 'Cognitive Services OpenAI User' role on the resource.",
      401,
    );
  }
  cachedToken = {
    token: result.token,
    expiresOnTimestamp: result.expiresOnTimestamp ?? now + 50 * 60 * 1000,
  };
  return result.token;
}

/**
 * Resolve auth headers — prefer Entra ID, fall back to API key if provided.
 * Throws if neither is available.
 */
async function authHeaders(cfg: AzureConfig): Promise<Record<string, string>> {
  if (cfg.apiKey) {
    // Send both — Azure resources that have keys enabled accept either; the
    // one not honored is ignored.
    return { "api-key": cfg.apiKey, Authorization: `Bearer ${cfg.apiKey}` };
  }
  try {
    const token = await getAccessToken();
    return { Authorization: `Bearer ${token}` };
  } catch (e) {
    if (e instanceof AzureOpenAIError) throw e;
    throw new AzureOpenAIError(
      "No Azure credentials available. Either set AZURE_OPENAI_API_KEY, or run `az login` so DefaultAzureCredential can acquire a token.",
      401,
    );
  }
}

async function azureFetch(
  url: string,
  init: RequestInit,
  cfg: AzureConfig,
): Promise<Response> {
  const headers = await authHeaders(cfg);
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(init.headers || {}),
    },
    signal: init.signal,
  });
}

// ---------------------------------------------------------------------------
// Chat completions
// ---------------------------------------------------------------------------

export async function chatCompletion(opts: ChatOptions): Promise<string> {
  const cfg = getAzureConfig();
  requireConfig(cfg);
  if (!cfg.chatDeployment) {
    throw new AzureOpenAIError(
      "Chat deployment name is missing. Set AZURE_OPENAI_CHAT_DEPLOYMENT.",
      503,
    );
  }

  const v1 = isV1(cfg);
  const url = v1
    ? buildUrl(baseUrl(cfg), "/chat/completions", { "api-version": cfg.apiVersion || "preview" })
    : buildUrl(
        baseUrl(cfg),
        `/openai/deployments/${encodeURIComponent(cfg.chatDeployment)}/chat/completions`,
        { "api-version": cfg.apiVersion },
      );

  const body: Record<string, unknown> = {
    messages: opts.messages,
    temperature: opts.temperature ?? 0.6,
    max_tokens: opts.maxTokens ?? 1200,
  };
  if (v1) {
    body.model = cfg.chatDeployment;
  }

  if (opts.jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: opts.jsonSchema.name,
        strict: true,
        schema: opts.jsonSchema.schema,
      },
    };
  }

  const res = await azureFetch(url, { method: "POST", body: JSON.stringify(body) }, cfg);
  if (!res.ok) {
    const detail = await safeReadJson(res);
    throw new AzureOpenAIError(
      `Azure chat completion failed (${res.status})`,
      res.status,
      detail,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function structuredCompletion<T>(
  opts: ChatOptions & { jsonSchema: NonNullable<ChatOptions["jsonSchema"]> },
): Promise<T> {
  const raw = await chatCompletion(opts);
  try {
    return JSON.parse(raw) as T;
  } catch {
    const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    return JSON.parse(cleaned) as T;
  }
}

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

export interface ImageResult {
  b64: string;
  promptUsed: string;
  model: string;
}

/**
 * The gpt-image-* family only accepts 1024x1024, 1536x1024, 1024x1536 (and
 * "auto"). The 1792x* sizes are DALL·E-3 only and return HTTP 400 on a
 * gpt-image deployment, so map them to the closest supported aspect.
 */
const SIZE_ALIASES: Record<string, string> = {
  "1792x1024": "1536x1024",
  "1024x1792": "1024x1536",
};

/** DALL·E-3 quality names mapped onto the gpt-image scale. */
const QUALITY_ALIASES: Record<string, string> = {
  standard: "medium",
  hd: "high",
};

export async function generateImage(opts: {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792" | "1536x1024" | "1024x1536";
  quality?: "standard" | "hd" | "low" | "medium" | "high";
  n?: number;
}): Promise<ImageResult[]> {
  const cfg = getAzureConfig();
  requireConfig(cfg);
  if (!cfg.imageDeployment) {
    throw new AzureOpenAIError(
      "Image deployment name is missing. Set AZURE_OPENAI_IMAGE_DEPLOYMENT.",
      503,
    );
  }

  const v1 = isV1(cfg);
  const url = v1
    ? buildUrl(baseUrl(cfg), "/images/generations", { "api-version": cfg.imageApiVersion })
    : buildUrl(
        baseUrl(cfg),
        `/openai/deployments/${encodeURIComponent(cfg.imageDeployment)}/images/generations`,
        { "api-version": cfg.imageApiVersion },
      );

  const body: Record<string, unknown> = {
    prompt: opts.prompt,
    size: SIZE_ALIASES[opts.size ?? ""] ?? opts.size ?? "1024x1024",
    n: opts.n ?? 1,
  };
  if (v1) body.model = cfg.imageDeployment;
  if (opts.quality) body.quality = QUALITY_ALIASES[opts.quality] ?? opts.quality;

  const res = await azureFetch(url, { method: "POST", body: JSON.stringify(body) }, cfg);
  if (!res.ok) {
    const detail = await safeReadJson(res);
    throw new AzureOpenAIError(
      `Azure image generation failed (${res.status})`,
      res.status,
      detail,
    );
  }

  const data = (await res.json()) as {
    data?: { b64_json?: string; url?: string; revised_prompt?: string }[];
  };
  if (!data.data || data.data.length === 0) {
    throw new AzureOpenAIError("Image API returned no images.", 502, data);
  }

  const out: ImageResult[] = [];
  for (const item of data.data) {
    if (item.b64_json) {
      out.push({
        b64: item.b64_json,
        promptUsed: item.revised_prompt ?? opts.prompt,
        model: cfg.imageDeployment,
      });
    } else if (item.url) {
      const b64 = await urlToBase64(item.url);
      out.push({
        b64,
        promptUsed: item.revised_prompt ?? opts.prompt,
        model: cfg.imageDeployment,
      });
    }
  }
  return out;
}

async function urlToBase64(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new AzureOpenAIError("Failed to fetch image URL.", 502);
  const buf = Buffer.from(await r.arrayBuffer());
  return buf.toString("base64");
}

async function safeReadJson(res: Response) {
  try {
    return await res.json();
  } catch {
    try {
      return await res.text();
    } catch {
      return undefined;
    }
  }
}

// ---------------------------------------------------------------------------
// Video generation
//
// Sora-2 (current GA/preview on Azure Foundry v1) uses the /videos endpoint:
//   POST  {base}/videos          -> { id, status, ... }
//   GET   {base}/videos/{id}     -> poll
//   GET   {base}/videos/{id}/content?variant=video  -> MP4 bytes
//
// Legacy Sora preview used /video/generations/jobs — we keep a fallback in
// case the deployment is the older shape.
// ---------------------------------------------------------------------------

export interface VideoJob {
  id: string;
  status:
    | "queued"
    | "in_progress"
    | "preprocessing"
    | "running"
    | "completed"
    | "succeeded"
    | "failed"
    | "cancelled";
  generations?: { id: string }[];
  failure_reason?: string;
  error?: { message?: string } | string;
}

export async function submitVideoJob(opts: {
  prompt: string;
  width?: number;
  height?: number;
  n_seconds?: number;
  n_variants?: number;
}): Promise<VideoJob> {
  const cfg = getAzureConfig();
  requireConfig(cfg);
  if (!cfg.videoDeployment) {
    throw new AzureOpenAIError(
      "Video deployment name is missing. Set AZURE_OPENAI_VIDEO_DEPLOYMENT.",
      503,
    );
  }

  const v1 = isV1(cfg);

  // Try the modern /videos endpoint first (sora-2 + Foundry v1).
  if (v1) {
    const url = buildUrl(baseUrl(cfg), "/videos", {
      "api-version": cfg.videoApiVersion,
    });
    // Sora-2 expects `size` as "WIDTHxHEIGHT" string and `seconds` as a string.
    const size = `${opts.width ?? 1280}x${opts.height ?? 720}`;
    const seconds = String(opts.n_seconds ?? 4);

    const body: Record<string, unknown> = {
      model: cfg.videoDeployment,
      prompt: opts.prompt,
      seconds,
      size,
    };

    const res = await azureFetch(url, { method: "POST", body: JSON.stringify(body) }, cfg);
    if (res.ok) {
      const job = (await res.json()) as VideoJob;
      return job;
    }
    const detail = await safeReadJson(res);
    throw new AzureOpenAIError(
      `Azure Sora video submit failed (${res.status})`,
      res.status,
      detail,
    );
  }

  // Legacy /video/generations/jobs (original Sora preview)
  const url = buildUrl(baseUrl(cfg), "/openai/v1/video/generations/jobs", {
    "api-version": cfg.videoApiVersion,
  });
  const body = {
    model: cfg.videoDeployment,
    prompt: opts.prompt,
    width: opts.width ?? 1280,
    height: opts.height ?? 720,
    n_seconds: opts.n_seconds ?? 5,
    n_variants: opts.n_variants ?? 1,
  };
  const res = await azureFetch(url, { method: "POST", body: JSON.stringify(body) }, cfg);
  if (!res.ok) {
    const detail = await safeReadJson(res);
    throw new AzureOpenAIError(
      `Azure Sora job submission failed (${res.status})`,
      res.status,
      detail,
    );
  }
  return (await res.json()) as VideoJob;
}

export async function getVideoJob(jobId: string): Promise<VideoJob> {
  const cfg = getAzureConfig();
  requireConfig(cfg);
  const v1 = isV1(cfg);
  const url = v1
    ? buildUrl(baseUrl(cfg), `/videos/${encodeURIComponent(jobId)}`, {
        "api-version": cfg.videoApiVersion,
      })
    : buildUrl(
        baseUrl(cfg),
        `/openai/v1/video/generations/jobs/${encodeURIComponent(jobId)}`,
        { "api-version": cfg.videoApiVersion },
      );

  const res = await azureFetch(url, { method: "GET" }, cfg);
  if (!res.ok) {
    const detail = await safeReadJson(res);
    throw new AzureOpenAIError(
      `Sora job poll failed (${res.status})`,
      res.status,
      detail,
    );
  }
  return (await res.json()) as VideoJob;
}

/** Fetch a finished video's MP4 bytes as base64. */
export async function fetchVideoContent(
  jobOrGenerationId: string,
): Promise<string> {
  const cfg = getAzureConfig();
  requireConfig(cfg);
  const v1 = isV1(cfg);
  const url = v1
    ? buildUrl(
        baseUrl(cfg),
        `/videos/${encodeURIComponent(jobOrGenerationId)}/content`,
        { "api-version": cfg.videoApiVersion, variant: "video" },
      )
    : buildUrl(
        baseUrl(cfg),
        `/openai/v1/video/generations/${encodeURIComponent(jobOrGenerationId)}/content/video`,
        { "api-version": cfg.videoApiVersion },
      );

  const headers = await authHeaders(cfg);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new AzureOpenAIError(
      `Sora video content fetch failed (${res.status})`,
      res.status,
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}
