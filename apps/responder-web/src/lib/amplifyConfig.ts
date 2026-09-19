import { Amplify } from 'aws-amplify';

const userPoolId =
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ||
  process.env.COGNITO_USER_POOL_ID ||
  'us-east-1_92uD8l6uE';

const userPoolClientId =
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ||
  process.env.COGNITO_CLIENT_ID ||
  '4o8r5rbke2t82v7b91kh9ie0r1';

const region =
  process.env.NEXT_PUBLIC_COGNITO_REGION ||
  process.env.COGNITO_REGION ||
  process.env.AWS_REGION ||
  'us-east-1';

export function configureAmplify() {
  if (!userPoolId || !userPoolClientId) {
    console.warn('[AmplifyConfig] Cognito credentials missing. Amplify Auth disabled.');
    return;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        signUpVerificationMethod: 'code',
        loginWith: {
          email: true,
        },
      },
    },
  });
}

configureAmplify();
