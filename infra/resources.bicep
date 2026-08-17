@description('Azure region for all resources.')
param location string

@description('Deterministic token generated at subscription scope.')
@minLength(13)
@maxLength(13)
param resourceToken string

@description('Deployment environment name.')
param environmentName string

@description('Azure OpenAI or Foundry v1 endpoint.')
param azureOpenAIEndpoint string

@description('Chat model deployment name.')
param azureOpenAIChatDeployment string

@description('Image model deployment name.')
param azureOpenAIImageDeployment string

@description('Video model deployment name.')
param azureOpenAIVideoDeployment string

@description('Disable image generation for cost control.')
param disableImageGeneration bool

@description('Disable video generation for cost control.')
param disableVideoGeneration bool

var containerRegistryName = 'azcr${resourceToken}'
var logAnalyticsName = 'azla${resourceToken}'
var containerEnvironmentName = 'azce${resourceToken}'
var runtimeIdentityName = 'azid${resourceToken}'
var containerAppName = 'azca${resourceToken}'
var tags = {
  environment: environmentName
  workload: 'campaign-autopilot'
}

module runtimeIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.6.0' = {
  name: 'runtime-identity'
  params: {
    name: runtimeIdentityName
    location: location
    tags: tags
  }
}

module containerRegistry 'br/public:avm/res/container-registry/registry:0.12.1' = {
  name: 'container-registry'
  params: {
    name: containerRegistryName
    location: location
    acrAdminUserEnabled: false
    acrSku: 'Basic'
    publicNetworkAccess: 'Enabled'
    tags: tags
  }
}

module logAnalytics 'br/public:avm/res/operational-insights/workspace:0.16.1' = {
  name: 'log-analytics'
  params: {
    name: logAnalyticsName
    location: location
    dataRetention: 30
    tags: tags
  }
}

module containerEnvironment 'br/public:avm/res/app/managed-environment:0.15.0' = {
  name: 'container-environment'
  params: {
    name: containerEnvironmentName
    location: location
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsWorkspaceResourceId: logAnalytics.outputs.resourceId
    }
    publicNetworkAccess: 'Enabled'
    zoneRedundant: false
    tags: tags
  }
}

resource containerRegistryResource 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: containerRegistryName
}

resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistryResource.id, runtimeIdentityName, 'AcrPull')
  scope: containerRegistryResource
  properties: {
    principalId: runtimeIdentity.outputs.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '7f951dda-4ed3-4680-a7ca-43fe172d538d'
    )
  }
  dependsOn: [
    containerRegistry
  ]
}

module containerApp 'br/public:avm/res/app/container-app:0.23.0' = {
  name: 'container-app'
  params: {
    name: containerAppName
    location: location
    environmentResourceId: containerEnvironment.outputs.resourceId
    containers: [
      {
        name: 'campaign-autopilot'
        image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        env: [
          {
            name: 'AZURE_OPENAI_ENDPOINT'
            value: azureOpenAIEndpoint
          }
          {
            name: 'AZURE_OPENAI_CHAT_DEPLOYMENT'
            value: azureOpenAIChatDeployment
          }
          {
            name: 'AZURE_OPENAI_IMAGE_DEPLOYMENT'
            value: azureOpenAIImageDeployment
          }
          {
            name: 'AZURE_OPENAI_VIDEO_DEPLOYMENT'
            value: azureOpenAIVideoDeployment
          }
          {
            name: 'AZURE_OPENAI_API_VERSION'
            value: 'preview'
          }
          {
            name: 'AZURE_OPENAI_IMAGE_API_VERSION'
            value: 'preview'
          }
          {
            name: 'AZURE_OPENAI_VIDEO_API_VERSION'
            value: 'preview'
          }
          {
            name: 'DISABLE_IMAGE_GENERATION'
            value: string(disableImageGeneration)
          }
          {
            name: 'DISABLE_VIDEO_GENERATION'
            value: string(disableVideoGeneration)
          }
        ]
        resources: {
          cpu: json('0.5')
          memory: '1Gi'
        }
      }
    ]
    managedIdentities: {
      userAssignedResourceIds: [
        runtimeIdentity.outputs.resourceId
      ]
    }
    registries: [
      {
        server: '${containerRegistryName}.azurecr.io'
        identity: runtimeIdentity.outputs.resourceId
      }
    ]
    corsPolicy: {
      allowedHeaders: [
        '*'
      ]
      allowedMethods: [
        'GET'
        'POST'
        'PUT'
        'PATCH'
        'DELETE'
        'OPTIONS'
      ]
      allowedOrigins: [
        '*'
      ]
      maxAge: 3600
    }
    ingressAllowInsecure: false
    ingressExternal: true
    ingressTargetPort: 3000
    scaleSettings: {
      minReplicas: 1
      maxReplicas: 3
    }
    tags: tags
  }
  dependsOn: [
    acrPullRoleAssignment
  ]
}

output containerRegistryName string = containerRegistry.outputs.name
output containerRegistryLoginServer string = '${containerRegistry.outputs.name}.azurecr.io'
output containerAppName string = containerApp.outputs.name
output containerAppUrl string = 'https://${containerApp.outputs.fqdn}'
output runtimeIdentityPrincipalId string = runtimeIdentity.outputs.principalId
