import { Request, Response, NextFunction } from "express";

export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {

  const apiKey =
    process.env.API_KEY ||
    "rescuelink-responder-key-2026";

  const provided =
    req.header("x-api-key");

  if (!provided || provided !== apiKey) {
    res.status(401).json({
      error: "Unauthorized access"
    });
    return;
  }

  next();
}
