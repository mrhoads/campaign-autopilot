#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -lt 2 ] || [ "$#" -gt 6 ]; then
  cat >&2 <<'USAGE'
Usage:
  setup-azure-auth-for-pipeline.sh SUBSCRIPTION_ID OWNER/REPOSITORY \
    [LOCATION] [GITHUB_ENVIRONMENT] [IDENTITY_RESOURCE_GROUP] [IDENTITY_NAME]

Example:
  setup-azure-auth-for-pipeline.sh 00000000-0000-0000-0000-000000000000 \
    octo-org/campaign-autopilot eastus2 production
USAGE
  exit 64
fi

subscription_id="$1"
repository="$2"
location="${3:-eastus2}"
github_environment="${4:-production}"
identity_resource_group="${5:-campaign-autopilot-pipeline}"
identity_name="${6:-campaign-autopilot-github}"
federated_credential_name="${github_environment}-environment"
subscription_scope="/subscriptions/${subscription_id}"

for command_name in az gh; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 69
  fi
done

az account set --subscription "$subscription_id"
tenant_id="$(az account show --query tenantId --output tsv)"

az group create \
  --name "$identity_resource_group" \
  --location "$location" \
  --tags workload=campaign-autopilot purpose=github-oidc \
  --only-show-errors \
  --output none

az identity create \
  --name "$identity_name" \
  --resource-group "$identity_resource_group" \
  --location "$location" \
  --only-show-errors \
  --output none

client_id="$(az identity show \
  --name "$identity_name" \
  --resource-group "$identity_resource_group" \
  --query clientId \
  --output tsv)"
principal_id="$(az identity show \
  --name "$identity_name" \
  --resource-group "$identity_resource_group" \
  --query principalId \
  --output tsv)"

for role_name in "Contributor" "Role Based Access Control Administrator"; do
  az role assignment create \
    --assignee-object-id "$principal_id" \
    --assignee-principal-type ServicePrincipal \
    --role "$role_name" \
    --scope "$subscription_scope" \
    --only-show-errors \
    --output none
done

if az identity federated-credential show \
  --name "$federated_credential_name" \
  --identity-name "$identity_name" \
  --resource-group "$identity_resource_group" \
  --only-show-errors \
  --output none 2>/dev/null; then
  echo "Federated credential already exists: $federated_credential_name"
else
  az identity federated-credential create \
    --name "$federated_credential_name" \
    --identity-name "$identity_name" \
    --resource-group "$identity_resource_group" \
    --issuer "https://token.actions.githubusercontent.com" \
    --subject "repo:${repository}:environment:${github_environment}" \
    --audiences "api://AzureADTokenExchange" \
    --only-show-errors \
    --output none
fi

gh api \
  --method PUT \
  "repos/${repository}/environments/${github_environment}" \
  >/dev/null
gh variable set AZURE_CLIENT_ID \
  --repo "$repository" \
  --env "$github_environment" \
  --body "$client_id"
gh variable set AZURE_TENANT_ID \
  --repo "$repository" \
  --env "$github_environment" \
  --body "$tenant_id"
gh variable set AZURE_SUBSCRIPTION_ID \
  --repo "$repository" \
  --env "$github_environment" \
  --body "$subscription_id"
gh variable set AZURE_LOCATION \
  --repo "$repository" \
  --env "$github_environment" \
  --body "$location"
gh variable set AZURE_ENVIRONMENT_NAME \
  --repo "$repository" \
  --env "$github_environment" \
  --body "$github_environment"
gh variable set AZURE_RESOURCE_GROUP_NAME \
  --repo "$repository" \
  --env "$github_environment" \
  --body "campaign-autopilot-${github_environment}-rg"

echo "Configured GitHub OIDC for ${repository} environment ${github_environment}."
echo "Add environment protection rules and application-specific variables in GitHub."
