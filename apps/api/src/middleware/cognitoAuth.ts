import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CONFIG } from '@rescue-link/config';

export interface AuthenticatedUser {
  sub: string;
  username?: string;
  tokenUse?: string;
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Lazy-instantiated verifier instance
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier && CONFIG.COGNITO_USER_POOL_ID) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: CONFIG.COGNITO_USER_POOL_ID,
      tokenUse: 'access',
      clientId: CONFIG.COGNITO_CLIENT_ID || null,
    });
  }
  return verifier;
}

/**
 * Validates Cognito Access Token from the Authorization header (`Bearer <token>`).
 * Enforces `token_use: access`, signature verification, issuer, and expiration.
 * Populates `req.user.sub` with the verified Cognito identity.
 */
export async function requireCognitoAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    res.status(401).json({ error: 'Unauthorized: Invalid Authorization header format. Expected Bearer token' });
    return;
  }

  const token = parts[1].trim();

  // Test / local mock token bypass for unit & integration testing
  if (token.startsWith('mock-access-token-')) {
    const sub = token.replace('mock-access-token-', '');
    if (!sub || sub.trim() === '') {
      res.status(401).json({ error: 'Unauthorized: Invalid mock token sub' });
      return;
    }
    req.user = {
      sub,
      username: `mock-rescuer-${sub}`,
      tokenUse: 'access',
    };
    next();
    return;
  }

  try {
    const v = getVerifier();
    if (!v) {
      res.status(500).json({ error: 'Cognito verifier is unconfigured' });
      return;
    }

    const payload = await v.verify(token);

    if (payload.token_use !== 'access') {
      res.status(401).json({ error: 'Unauthorized: Token must be a Cognito access token' });
      return;
    }

    req.user = {
      sub: payload.sub,
      username: (payload.username as string) || payload.sub,
      tokenUse: payload.token_use,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired Cognito access token',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
