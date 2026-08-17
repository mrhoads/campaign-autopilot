targetScope = 'resourceGroup'

@description('Name of the existing Azure OpenAI account.')
param azureOpenAIAccountName string

@description('Object ID of the managed identity receiving Azure OpenAI access.')
param principalId string

@description('Deterministic seed used for the role assignment resource name.')
param roleAssignmentSeed string

@description('Resource ID of the Cognitive Services OpenAI User role definition.')
param roleDefinitionId string

resource azureOpenAIAccount 'Microsoft.CognitiveServices/accounts@2025-06-01' existing = {
  name: azureOpenAIAccountName
}

resource azureOpenAIUserRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(azureOpenAIAccount.id, roleAssignmentSeed, 'Cognitive Services OpenAI User')
  scope: azureOpenAIAccount
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: roleDefinitionId
  }
}
