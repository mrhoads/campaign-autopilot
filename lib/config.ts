/**
 * Centralized config + capability detection.
 *
 * Reads env vars on the server only. Capability flags expose to the UI
 * (via /api/status) which providers are actually wired up — that lets us
 * gracefully fall back to mocks and surface a banner to the user.
 */

export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  imageApiVersion: string;
  videoApiVersion: string;
  chatDeployment: string;
  imageDeployment: string;
  videoDeployment: string;
}

export interface Capabilities {
  chat: boolean;
  image: boolean;
  video: boolean;
}

function readEnv(name: string, fallback = ""): string {
  const v = process.env[name];
  return v === undefined || v === null ? fallback : v.trim();
}

export function getAzureConfig(): AzureConfig {
  return {
    endpoint: readEnv("AZURE_OPENAI_ENDPOINT").replace(/\/+$/, ""),
    apiKey: readEnv("AZURE_OPENAI_API_KEY"),
    // For the Foundry v1 endpoint, "preview" works for chat + images.
    // For classic Azure OpenAI, "2024-10-21" is GA.
    apiVersion: readEnv("AZURE_OPENAI_API_VERSION", "preview"),
    imageApiVersion: readEnv(
      "AZURE_OPENAI_IMAGE_API_VERSION",
      "preview",
    ),
    videoApiVersion: readEnv("AZURE_OPENAI_VIDEO_API_VERSION", "preview"),
    chatDeployment: readEnv("AZURE_OPENAI_CHAT_DEPLOYMENT"),
    imageDeployment: readEnv("AZURE_OPENAI_IMAGE_DEPLOYMENT"),
    videoDeployment: readEnv("AZURE_OPENAI_VIDEO_DEPLOYMENT"),
  };
}

export function getCapabilities(): Capabilities {
  const cfg = getAzureConfig();
  // Auth is available if an API key is set OR we can attempt Entra ID.
  // We can't synchronously verify Entra ID here, so we treat endpoint+deployment
  // as "configured" — actual auth failures surface as 401 from API routes and
  // the client falls back to mocks.
  const endpointReady = Boolean(cfg.endpoint);
  const imageDisabled = readEnv("DISABLE_IMAGE_GENERATION") === "true";
  const videoDisabled = readEnv("DISABLE_VIDEO_GENERATION") === "true";
  return {
    chat: endpointReady && Boolean(cfg.chatDeployment),
    image: endpointReady && Boolean(cfg.imageDeployment) && !imageDisabled,
    video: endpointReady && Boolean(cfg.videoDeployment) && !videoDisabled,
  };
}
