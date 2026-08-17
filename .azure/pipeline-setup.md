# GitHub Actions Azure Setup

The deployment workflow uses GitHub OpenID Connect (OIDC). It does not require
an Azure client secret. Use a dedicated user-assigned managed identity for the
pipeline; do not reuse the managed identity created for the Container App.

## Prerequisites

- Azure CLI authenticated as a principal that can create a resource group,
  managed identity, role assignments, and federated credentials.
- GitHub CLI authenticated with permission to manage this repository's
  environments and variables.
- The Azure resource providers used by `infra/main.bicep` registered in the
  target subscription.

## Configure the Pipeline Identity

From the repository root, run:

```bash
chmod +x scripts/setup-azure-auth-for-pipeline.sh
scripts/setup-azure-auth-for-pipeline.sh \
  c8fad4c4-3897-42b5-bbc2-5d96f255f209 \
  mrhoads/campaign-autopilot \
  eastus2 \
  production
```

The script creates a separate `campaign-autopilot-pipeline` resource group and
`campaign-autopilot-github` identity. It assigns:

- **Contributor** at subscription scope so the subscription deployment can
  create the workload resource group and resources.
- **Role Based Access Control Administrator** at subscription scope so Bicep can
  create the runtime identity's `AcrPull` assignment.

These subscription-scoped roles are required by the current design because the
workflow creates a new resource group. If an Azure platform team pre-creates
resource groups, narrow both assignments to those groups instead and change the
Bicep entry point to resource-group scope.

The script queries GitHub's OIDC configuration and creates an
environment-scoped federated credential from the repository's current subject
prefix. For this repository, the subject is:

```text
repo:mrhoads@5631679/campaign-autopilot@1334362774:environment:production
```

Deriving the prefix from GitHub avoids login failures when GitHub uses immutable
owner and repository IDs in OIDC claims.

## Protect the GitHub Environment

In **Settings > Environments > production**:

1. Add required reviewers appropriate for the repository.
2. Prevent administrators from bypassing the protection rule if organizational
   policy requires it.
3. Restrict deployment branches to `main`.

The setup script configures these environment variables:

| Variable | Purpose |
|----------|---------|
| `AZURE_CLIENT_ID` | Pipeline managed identity client ID |
| `AZURE_TENANT_ID` | Microsoft Entra tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Target Azure subscription |
| `AZURE_LOCATION` | Deployment region |
| `AZURE_ENVIRONMENT_NAME` | Stable resource naming boundary |
| `AZURE_RESOURCE_GROUP_NAME` | Dedicated workload resource group created by the first deployment |

Configure the optional application variables in the same environment:

| Variable | Default | Purpose |
|----------|---------|---------|
| `AZURE_OPENAI_ENDPOINT` | Empty | Existing Foundry or Azure OpenAI endpoint |
| `AZURE_OPENAI_CHAT_DEPLOYMENT` | `gpt-4.1` | Chat deployment |
| `AZURE_OPENAI_IMAGE_DEPLOYMENT` | `gpt-image-2` | Image deployment |
| `AZURE_OPENAI_VIDEO_DEPLOYMENT` | `sora-2` | Video deployment |
| `DISABLE_IMAGE_GENERATION` | `false` | Image-generation kill switch |
| `DISABLE_VIDEO_GENERATION` | `false` | Video-generation kill switch |

No application API key is stored in GitHub. If live AI calls are enabled, grant
the Container App runtime principal shown in the workflow summary the
**Cognitive Services OpenAI User** role on the existing AI resource.

## First Deployment

Run **Deploy to Azure** manually or push to `main`. The workflow:

1. Validates and builds the application.
2. Validates and applies the subscription-scoped Bicep deployment.
3. Creates the new `campaign-autopilot-production-rg` resource group for the
   `production` environment. Later runs update it only when its workload and
   environment tags match.
4. Builds the container image in ACR and updates the Container App.
5. Verifies the HTTPS endpoint and publishes it in the job summary.

Later runs update the same resource group because resource names are derived
from the subscription, location, and `AZURE_ENVIRONMENT_NAME`.
