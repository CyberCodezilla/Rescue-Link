import { Request, Response, NextFunction } from "express";

export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const configuredKey =
    process.env.API_KEY ||
    "rescuelink-responder-key-2026";

  const providedKey = req.header("x-api-key");

  if (!providedKey || providedKey !== configuredKey) {
    res.status(401).json({
      error: "Unauthorized access",
    });
    return;
  }

  next();
}
