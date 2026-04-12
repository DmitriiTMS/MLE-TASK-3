import { config } from 'dotenv';
import * as path from 'path';

const result = config({ path: path.resolve(process.cwd(), '.env.test') });

if (result.error) {
  console.error('❌ Failed to load .env.test:', result.error);
  process.exit(1);
}
