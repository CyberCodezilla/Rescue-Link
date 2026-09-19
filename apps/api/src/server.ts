import path from 'node:path';
import dotenv from 'dotenv';
// Load from both apps/api/.env and monorepo root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import 'dotenv/config'; // MUST be the first import to load .env before other modules evaluate process.env

import { CONFIG } from '@rescue-link/config';
import { app } from './app';

const server = app.listen(CONFIG.PORT, () => {
  console.log(`🚀 RescueLink API server listening on http://localhost:${CONFIG.PORT}`);
  console.log(`Environment: ${CONFIG.NODE_ENV}`);
  console.log(`Loaded SNS Topic: ${CONFIG.SNS_TOPIC_ARN || 'NONE'}`);
  console.log(`Loaded SES Email: ${CONFIG.SES_FROM_EMAIL}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
