# RescueLink AWS Lambda Integration

RescueLink keeps the persistent Express.js server for REST APIs and long-lived Server-Sent Events. AWS Lambda is added as the asynchronous emergency workflow layer, orchestrated by AWS Step Functions.

## Runtime flow

```text
Survivor Web
    |
    v
Express POST /api/incidents
    |
    +--> DynamoDB: create incident
    |
    +--> Step Functions StartExecution
              |
              +--> Lambda: AI Triage
              |       |
              |       +--> Bedrock Claude 3 Haiku
              |       +--> DynamoDB update
              |
              +--> Lambda: Emergency Notifications
              |       +--> SNS
              |       +--> SES
              |
              +--> Lambda: SSE Callback
                      |
                      v
                Express /api/workflows/triage
                      |
                      v
                  SSE broadcast
                      |
                      v
               Responder Dashboard
```

## Local behavior

If `STATE_MACHINE_ARN` is empty, RescueLink preserves the existing in-process triage workflow. This keeps local development usable without AWS deployment.

If `STATE_MACHINE_ARN` is configured, the API starts the Step Functions workflow and does not run the local triage/notification path for the same incident.

## Required API environment

```env
AWS_REGION=us-east-1
DYNAMODB_TABLE_INCIDENTS=rescue-incidents
STATE_MACHINE_ARN=arn:aws:states:REGION:ACCOUNT:stateMachine:rescuelink-emergency-workflow
RESCUELINK_CALLBACK_URL=https://YOUR_PUBLIC_API_DOMAIN/api/workflows/triage
LAMBDA_CALLBACK_SECRET=<same-secret-used-by-SAM-stack>
```

The API uses the AWS default credential provider chain and SigV4 to call Step Functions. No long-lived AWS access keys are hardcoded in the project.

## AWS deployment

Prerequisites:

- Node.js 20+
- AWS CLI configured
- AWS SAM CLI
- Bedrock model access enabled for Claude 3 Haiku in the selected region
- Verified SES sender identity
- Appropriate AWS account permissions

Deploy:

```bash
npm install
sam build --template-file template.yaml
sam deploy --guided --template-file .aws-sam/build/template.yaml
```

The SAM template creates:

- `TriageFunction`
- `NotificationFunction`
- `CallbackFunction`
- `RescueWorkflow`
- `EmergencyTopic`

The existing `rescue-incidents` DynamoDB table is referenced by name and is not recreated by the template.

## IAM behavior

Triage Lambda:

- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `bedrock:InvokeModel`

Notification Lambda:

- `sns:Publish`
- `ses:SendEmail`

Step Functions:

- invoke the three Lambda functions

The Express API needs permission to call Step Functions `StartExecution` through its AWS identity.

## Notification behavior

SNS publishes to the configured topic when available. If the incident contains a phone contact and no topic is configured, SNS uses the phone number directly.

SES sends the critical/high HTML alert to the configured responder email.

The workflow returns actual `snsSent` and `sesSent` values. Failures are not represented as successful delivery.

## SSE callback security

The callback Lambda sends `x-rescuelink-callback-secret`.

The Express callback route rejects requests unless the header matches `LAMBDA_CALLBACK_SECRET`.

## Important production configuration

- Keep `LAMBDA_CALLBACK_SECRET` long and random.
- Put the Express API behind HTTPS before exposing the callback URL.
- Use IAM roles rather than static AWS access keys.
- Verify SES identities before production email delivery.
- Grant Bedrock model access in the AWS account/region.
- Confirm the DynamoDB table uses the expected primary key `id`.
- Do not commit `.env` files or AWS credentials.
