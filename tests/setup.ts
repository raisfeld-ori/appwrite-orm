import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env files for tests
// First load .env.test if it exists, then .env as fallback
config({ path: resolve(process.cwd(), '.env.test') });
config({ path: resolve(process.cwd(), '.env') });