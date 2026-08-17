targetScope = 'subscription'

@description('Azure region for all resources.')
param location string = 'eastus2'

@description('Environment name used to create deterministic resource names.')
@minLength(1)
@maxLength(12)
param environmentName string = 'prod'

@description('Name of the resource group created for this workload environment.')
@minLength(1)
@maxLength(90)
param resourceGroupName string = 'campaign-autopilot-${environmentName}-rg'

@description('Azure OpenAI or Foundry v1 endpoint.')
@minLength(1)
param azureOpenAIEndpoint string

@description('Chat model deployment name.')
param azureOpenAIChatDeployment string = 'gpt-4.1'

@description('Image model deployment name.')
param azureOpenAIImageDeployment string = 'gpt-image-2'

@description('Video model deployment name.')
param azureOpenAIVideoDeployment string = 'sora-2'

@description('Resource group containing the existing Azure OpenAI account.')
param azureOpenAIResourceGroupName string

@description('Name of the existing Azure OpenAI account.')
param azureOpenAIAccountName string

@description('Disable image generation for cost control.')
param disableImageGeneration bool = false

@description('Disable video generation for cost control.')
param disableVideoGeneration bool = false

var resourceToken = uniqueString(subscription().id, location, environmentName)
var cognitiveServicesOpenAIUserRoleDefinitionId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
)

resource workloadResourceGroup 'Microsoft.Resources/resourceGroups@2025-04-01' = {
  name: resourceGroupName
  location: location
  tags: {
    environment: environmentName
    workload: 'campaign-autopilot'
  }
}

module resources 'resources.bicep' = {
  name: 'campaign-autopilot-${environmentName}'
  scope: workloadResourceGroup
  params: {
    location: location
    resourceToken: resourceToken
    environmentName: environmentName
    azureOpenAIEndpoint: azureOpenAIEndpoint
    azureOpenAIChatDeployment: azureOpenAIChatDeployment
    azureOpenAIImageDeployment: azureOpenAIImageDeployment
    azureOpenAIVideoDeployment: azureOpenAIVideoDeployment
    disableImageGeneration: disableImageGeneration
    disableVideoGeneration: disableVideoGeneration
  }
}

module azureOpenAIAccess 'ai-access.bicep' = {
  name: 'azure-openai-access-${environmentName}'
  scope: resourceGroup(azureOpenAIResourceGroupName)
  params: {
    azureOpenAIAccountName: azureOpenAIAccountName
    principalId: resources.outputs.runtimeIdentityPrincipalId
    roleAssignmentSeed: resourceToken
    roleDefinitionId: cognitiveServicesOpenAIUserRoleDefinitionId
  }
}

output resourceGroupName string = workloadResourceGroup.name
output containerRegistryName string = resources.outputs.containerRegistryName
output containerRegistryLoginServer string = resources.outputs.containerRegistryLoginServer
output containerAppName string = resources.outputs.containerAppName
output containerAppUrl string = resources.outputs.containerAppUrl
output runtimeIdentityPrincipalId string = resources.outputs.runtimeIdentityPrincipalId
output runtimeIdentityClientId string = resources.outputs.runtimeIdentityClientId
output azureOpenAIEndpoint string = azureOpenAIEndpoint
