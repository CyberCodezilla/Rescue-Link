$ErrorActionPreference = "Stop"
npm install
npm run build:lambda
sam build --template-file template.yaml
sam deploy --guided --template-file .aws-sam/build/template.yaml
