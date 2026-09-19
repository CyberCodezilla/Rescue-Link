# Powershell script to setup Cognito User Pool and Client for RescueLink

$region = "us-east-1"
$poolName = "RescueLinkUserPool"
$clientName = "RescueLinkWebClient"

Write-Host "Creating Cognito User Pool '$poolName'..."
$userPoolJson = aws cognito-idp create-user-pool `
  --pool-name $poolName `
  --auto-verified-attributes email `
  --username-attributes email `
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}" `
  --region $region | ConvertFrom-Json

$userPoolId = $userPoolJson.UserPool.Id
Write-Host "UserPoolId: $userPoolId"

Write-Host "Creating User Pool Client '$clientName'..."
$clientJson = aws cognito-idp create-user-pool-client `
  --user-pool-id $userPoolId `
  --client-name $clientName `
  --no-generate-secret `
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_PASSWORD_AUTH `
  --region $region | ConvertFrom-Json

$clientId = $clientJson.UserPoolClient.ClientId
Write-Host "ClientId: $clientId"

Write-Host "`nSuccessfully created Cognito Resources!"
Write-Host "Set the following environment variables in apps/responder-web/.env.local:"
Write-Host "NEXT_PUBLIC_COGNITO_USER_POOL_ID=$userPoolId"
Write-Host "NEXT_PUBLIC_COGNITO_CLIENT_ID=$clientId"
Write-Host "NEXT_PUBLIC_COGNITO_REGION=$region"
