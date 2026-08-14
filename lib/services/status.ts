/**
 * Status / capability detection on the client side.
 *
 * The /api/status route reports which Azure deployments are configured.
 * Components read this to decide whether to call real APIs or fall back to
 * the mock layer. Cached after first call.
 */

export interface ClientCapabilities {
  chat: boolean;
  image: boolean;
  video: boolean;
  endpointConfigured: boolean;
  chatDeployment: string | null;
  imageDeployment: string | null;
  videoDeployment: string | null;
}

let cached: Promise<ClientCapabilities> | undefined;

export function getClientCapabilities(force = false): Promise<ClientCapabilities> {
  if (!cached || force) {
    cached = fetch("/api/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => ({
        chat: !!data?.capabilities?.chat,
        image: !!data?.capabilities?.image,
        video: !!data?.capabilities?.video,
        endpointConfigured: !!data?.endpointConfigured,
        chatDeployment: data?.chatDeployment ?? null,
        imageDeployment: data?.imageDeployment ?? null,
        videoDeployment: data?.videoDeployment ?? null,
      }))
      .catch(() => ({
        chat: false,
        image: false,
        video: false,
        endpointConfigured: false,
        chatDeployment: null,
        imageDeployment: null,
        videoDeployment: null,
      }));
  }
  return cached;
}
