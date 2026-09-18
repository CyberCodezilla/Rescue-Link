# RescueLink

Offline-first emergency response platform with survivor SOS, responder dispatch, AI triage, real-time SSE, DynamoDB, SNS, SES, and AWS Lambda workflows.

## AWS architecture

Express.js remains responsible for REST APIs and long-lived SSE connections. AWS Step Functions orchestrates asynchronous emergency processing through Lambda.

```text
Survivor → Express API → Step Functions
                         ├─ Lambda → Bedrock → DynamoDB
                         ├─ Lambda → SNS / SES
                         └─ Lambda → Express callback → SSE → Responder
```

See `docs/AWS_LAMBDA_INTEGRATION.md` for deployment and configuration.
