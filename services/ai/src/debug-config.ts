import dotenv from 'dotenv';
import path from 'path';

// ✅ Load .env from the project root (one level up)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { config } from './config';

console.log('🔍 Debugging Config\n');

console.log('HuggingFace Config:');
console.log(
  '- API Key:',
  config.huggingface.apiKey
    ? config.huggingface.apiKey.substring(0, 10) +
        '...' +
        config.huggingface.apiKey.substring(config.huggingface.apiKey.length - 4)
    : '❌ Not set'
);
console.log('- Model:', config.huggingface.model);
console.log('- Dimension:', config.huggingface.embeddingDimension);

console.log('\nEnvironment Variables:');
console.log(
  '- HF_TOKEN:',
  process.env.HF_TOKEN
    ? process.env.HF_TOKEN.substring(0, 10) +
        '...' +
        process.env.HF_TOKEN.substring(process.env.HF_TOKEN.length - 4)
    : '❌ Not set'
);
