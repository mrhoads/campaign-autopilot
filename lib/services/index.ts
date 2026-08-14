/**
 * Service layer index — exposes a stable contract for the UI while keeping the
 * underlying implementation swappable.
 *
 * Today: every service is a mock that resolves with curated data after a
 * realistic latency.
 *
 * Tomorrow: the same exports can be backed by:
 *   - Azure AI Foundry agent orchestration for `campaignOrchestrator`
 *   - A governed brand rules service for `brandValidator`
 *   - A content generation agent (Foundry / OpenAI / Contoso internal) for
 *     `contentGenerator`
 *   - An MCP-connected creative tools gateway for `creativeToolGateway`
 *   - The enterprise approval workflow API for `approvalWorkflow`
 *
 * UI components import only from this index so the swap is a single-file
 * change.
 */
export * as campaignOrchestrator from "./campaignOrchestrator";
export * as brandValidator from "./brandValidator";
export * as contentGenerator from "./contentGenerator";
export * as creativeToolGateway from "./creativeToolGateway";
export * as approvalWorkflow from "./approvalWorkflow";
export * as status from "./status";
